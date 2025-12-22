'use client';

/**
 * Read Receipts Hook
 *
 * Single source of truth for read receipt calculations.
 * Eliminates duplicated logic across MessageView and services.
 *
 * @module messaging/hooks/useReadReceipts
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import supabase from '@/lib/supabase/browser';
import type { Message } from '../types';
import { MESSAGE_STATUS, TIMING, debugLog } from '../lib/constants';
import type { MessageStatus } from '../lib/constants';

interface ParticipantReadTime {
  userId: string;
  lastReadAt: Date | null;
}

interface UseReadReceiptsOptions {
  /** Whether the hook is enabled */
  enabled?: boolean;
  /** Current user ID */
  userId: string | undefined;
}

interface UseReadReceiptsReturn {
  /** Map of userId to lastReadAt */
  participantReadTimes: Map<string, Date | null>;
  /** Calculate status for a single message */
  calculateMessageStatus: (message: Message) => MessageStatus;
  /** Apply read status to an array of messages */
  applyReadStatus: (messages: Message[]) => Message[];
  /** Manually refresh participant read times */
  refresh: () => Promise<void>;
  /** Whether data is loading */
  isLoading: boolean;
}

/**
 * Hook for managing read receipt state and calculations
 */
export function useReadReceipts(
  conversationId: string | null,
  options: UseReadReceiptsOptions
): UseReadReceiptsReturn {
  const { enabled = true, userId } = options;

  const [participantReadTimes, setParticipantReadTimes] = useState<Map<string, Date | null>>(
    new Map()
  );
  const participantReadTimesRef = useRef<Map<string, Date | null>>(participantReadTimes);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Keep a ref in sync so our callbacks can stay stable without re-subscribing
  useEffect(() => {
    participantReadTimesRef.current = participantReadTimes;
  }, [participantReadTimes]);

  /**
   * Fetch participant read times from the database
   */
  const fetchParticipantReadTimes = useCallback(async () => {
    if (!conversationId || !enabled || hasError) {
      return;
    }

    setIsLoading(true);
    try {
      const { data: participants, error } = await supabase
        .from('conversation_participants')
        .select('user_id, last_read_at')
        .eq('conversation_id', conversationId)
        .eq('is_active', true);

      if (error) {
        debugLog('Error fetching participant read times:', error);
        // If the error is about a missing table or any database error, disable read receipts
        if (
          error.message &&
          (error.message.includes('participant_read_times') ||
            error.message.includes('does not exist') ||
            error.code === '42P17')
        ) {
          debugLog('Database schema error detected, disabling read receipts for this session');
          setHasError(true);
          setParticipantReadTimes(new Map());
          return;
        }
        return;
      }

      const newMap = new Map<string, Date | null>();
      (participants || []).forEach((p: any) => {
        newMap.set(p.user_id, p.last_read_at ? new Date(p.last_read_at) : null);
      });

      setParticipantReadTimes(newMap);
    } catch (error) {
      debugLog('Error in fetchParticipantReadTimes:', error);
      // On any error, set empty map to prevent the UI from breaking
      setParticipantReadTimes(new Map());
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, enabled]);

  /**
   * Calculate the status for a single message
   */
  const calculateMessageStatus = useCallback(
    (message: Message): MessageStatus => {
      if (!userId || hasError) {
        return MESSAGE_STATUS.DELIVERED;
      }

      // Always read the latest participant read times from a ref to keep
      // this callback stable and avoid triggering re-subscriptions/fetches
      const currentReadTimes = participantReadTimesRef.current;

      // Optimistic/pending messages
      if (message.id.startsWith('temp-')) {
        return MESSAGE_STATUS.PENDING;
      }

      // Failed messages
      if (message.status === MESSAGE_STATUS.FAILED) {
        return MESSAGE_STATUS.FAILED;
      }

      const messageCreatedAt = new Date(message.created_at);

      // Messages FROM the current user - check if recipients have read
      if (message.sender_id === userId) {
        // Check if any recipient has read this message
        for (const [participantId, lastReadAt] of currentReadTimes.entries()) {
          if (participantId !== userId && lastReadAt) {
            if (messageCreatedAt <= lastReadAt) {
              return MESSAGE_STATUS.READ;
            }
          }
        }
        // If in database, it's at least delivered
        return MESSAGE_STATUS.DELIVERED;
      }

      // Messages TO the current user - check if current user has read
      const userLastReadAt = currentReadTimes.get(userId);
      if (userLastReadAt && messageCreatedAt <= userLastReadAt) {
        return MESSAGE_STATUS.READ;
      }

      return MESSAGE_STATUS.DELIVERED;
    },
    [userId, hasError]
  );

  /**
   * Apply read status to an array of messages
   */
  const applyReadStatus = useCallback(
    (messages: Message[]): Message[] => {
      return messages.map(msg => {
        const status = calculateMessageStatus(msg);
        return {
          ...msg,
          status,
          is_read: status === MESSAGE_STATUS.READ,
          is_delivered: status === MESSAGE_STATUS.DELIVERED || status === MESSAGE_STATUS.READ,
        };
      });
    },
    [calculateMessageStatus]
  );

  // Initial fetch
  useEffect(() => {
    if (conversationId && enabled) {
      fetchParticipantReadTimes();
    }
  }, [conversationId, enabled, fetchParticipantReadTimes]);

  // Subscribe to participant updates for real-time read receipts
  useEffect(() => {
    if (!conversationId || !enabled || !userId) {
      return;
    }

    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel(`read-receipts:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          // Update the specific participant's read time
          if (payload.new && typeof payload.new === 'object') {
            const { user_id, last_read_at } = payload.new as any;
            if (user_id) {
              debugLog('[useReadReceipts] Read receipt updated via real-time', {
                userId: user_id,
                lastReadAt: last_read_at,
                conversationId,
              });
              setParticipantReadTimes(prev => {
                const newMap = new Map(prev);
                newMap.set(user_id, last_read_at ? new Date(last_read_at) : null);
                debugLog('[useReadReceipts] Updated participant read times', {
                  size: newMap.size,
                });
                return newMap;
              });
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [conversationId, enabled, userId]);

  return {
    participantReadTimes,
    calculateMessageStatus,
    applyReadStatus,
    refresh: fetchParticipantReadTimes,
    isLoading,
  };
}
