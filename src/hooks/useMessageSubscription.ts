'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type { Message } from '@/features/messaging/types';
import { CHANNELS, debugLog, TIMING } from '@/features/messaging/lib/constants';
import { fetchFullMessage } from '@/features/messaging/lib/message-utils';

interface UseMessageSubscriptionOptions {
  onNewMessage?: (message: Message) => void;
  onOwnMessage?: (messageId: string) => void;
  onReadReceiptUpdate?: (conversationId: string) => void;
  enabled?: boolean;
  /** Callback when subscription status changes */
  onSubscriptionStatusChange?: (status: string, error?: Error) => void;
}

/**
 * Unified hook for subscribing to message updates in a conversation.
 * Prevents duplicate subscriptions and manages cleanup automatically.
 *
 * @param conversationId - The conversation ID to subscribe to
 * @param options - Configuration options
 * @returns Cleanup function (automatically called on unmount)
 */
export function useMessageSubscription(
  conversationId: string | null,
  options: UseMessageSubscriptionOptions = {}
) {
  const { user } = useAuth();
  const {
    onNewMessage,
    onOwnMessage,
    onReadReceiptUpdate,
    enabled = true,
    onSubscriptionStatusChange,
  } = options;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callbacksRef = useRef({ onNewMessage, onOwnMessage, onReadReceiptUpdate });
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const attemptReconnectRef = useRef<(() => void) | null>(null);
  const setupInProgressRef = useRef(false);
  const hasSubscribedRef = useRef(false);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onNewMessage, onOwnMessage, onReadReceiptUpdate };
  }, [onNewMessage, onOwnMessage, onReadReceiptUpdate]);

  /**
   * Calculate exponential backoff delay for reconnection
   */
  const getReconnectDelay = useCallback(() => {
    const baseDelay = TIMING.RECONNECT_INITIAL_DELAY_MS;
    const exponentialDelay = baseDelay * Math.pow(2, reconnectAttemptsRef.current);
    return Math.min(exponentialDelay, TIMING.RECONNECT_MAX_DELAY_MS);
  }, []);

  /**
   * Setup the subscription
   */
  const setupSubscription = useCallback(() => {
    if (!conversationId || !user?.id || !enabled || !isMountedRef.current) {
      return;
    }

    // Prevent duplicate setup
    if (setupInProgressRef.current) {
      debugLog('[useMessageSubscription] setup already in progress, skipping');
      return;
    }

    // If already subscribed to this conversation, skip
    if (hasSubscribedRef.current && channelRef.current) {
      debugLog('[useMessageSubscription] already subscribed, skipping');
      return;
    }

    setupInProgressRef.current = true;

    // Clean up existing channel
    if (channelRef.current) {
      debugLog('[useMessageSubscription] cleaning up existing channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    debugLog(`[useMessageSubscription] creating channel for ${conversationId}`);

    /**
     * Attempt to reconnect the subscription
     */
    const attemptReconnect = () => {
      if (!conversationId || !user?.id || !enabled || !isMountedRef.current) {
        return;
      }

      if (reconnectAttemptsRef.current >= TIMING.RECONNECT_MAX_ATTEMPTS) {
        debugLog('[useMessageSubscription] Max reconnection attempts reached');
        if (onSubscriptionStatusChange) {
          onSubscriptionStatusChange('ERROR', new Error('Max reconnection attempts reached'));
        }
        return;
      }

      reconnectAttemptsRef.current += 1;
      const delay = getReconnectDelay();

      debugLog(
        `[useMessageSubscription] Reconnecting (attempt ${reconnectAttemptsRef.current}/${TIMING.RECONNECT_MAX_ATTEMPTS}) in ${delay}ms`
      );

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }
        setupSubscription();
      }, delay);
    };

    // Store in ref for access in subscribe callback
    attemptReconnectRef.current = attemptReconnect;

    const channel = supabase
      .channel(CHANNELS.MESSAGES(conversationId), {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async payload => {
          debugLog('[useMessageSubscription] insert', { messageId: payload.new.id });
          const { onNewMessage, onOwnMessage } = callbacksRef.current;

          if (payload.new.sender_id === user.id) {
            debugLog('[useMessageSubscription] own message; onOwnMessage');
            if (onOwnMessage) {
              onOwnMessage(payload.new.id);
            }
            return;
          }

          try {
            const newMessage = await fetchFullMessage(supabase, payload.new.id, payload.new);
            if (newMessage) {
              if (onNewMessage) {
                onNewMessage(newMessage);
              } else {
                logger.warn('onNewMessage callback not provided', undefined, 'Messaging');
              }
            } else {
              logger.error('Failed to create message object from payload', undefined, 'Messaging');
            }
          } catch (error) {
            logger.error('Error processing real-time message', error, 'Messaging');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async payload => {
          const { onNewMessage } = callbacksRef.current;
          debugLog('[useMessageSubscription] update', payload.new.id);
          if (onNewMessage && payload.new) {
            try {
              const updated = await fetchFullMessage(supabase, payload.new.id, payload.new);
              if (updated) {
                onNewMessage(updated);
              }
            } catch (error) {
              logger.error('Error processing message update', error, 'Messaging');
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async payload => {
          debugLog('[useMessageSubscription] read receipt update', {
            conversationId,
            userId: payload.new?.user_id,
          });

          const { onReadReceiptUpdate } = callbacksRef.current;
          // When someone marks conversation as read, update read receipts for sender's messages
          if (onReadReceiptUpdate && payload.new) {
            onReadReceiptUpdate(conversationId);
          }
        }
      )
      .subscribe((status, err) => {
        if (!isMountedRef.current) {
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          const error = err || new Error(`Subscription error: ${status}`);
          logger.error(`Channel error for ${conversationId}`, error, 'Messaging');
          setupInProgressRef.current = false;
          if (onSubscriptionStatusChange) {
            onSubscriptionStatusChange(status, error);
          }
          // Attempt to reconnect
          if (attemptReconnectRef.current) {
            attemptReconnectRef.current();
          }
        } else if (status === 'SUBSCRIBED') {
          reconnectAttemptsRef.current = 0; // Reset on successful subscription
          setupInProgressRef.current = false;
          hasSubscribedRef.current = true;
          debugLog(`[useMessageSubscription] ✅ Successfully subscribed to ${conversationId}`);
          if (onSubscriptionStatusChange) {
            onSubscriptionStatusChange(status);
          }
        } else if (status === 'CLOSED') {
          debugLog(`[useMessageSubscription] ⚠️ Channel closed for ${conversationId}`);
          setupInProgressRef.current = false;
          if (onSubscriptionStatusChange) {
            onSubscriptionStatusChange(status);
          }
          // Only attempt to reconnect if we were previously subscribed and not intentionally closed
          if (
            hasSubscribedRef.current &&
            isMountedRef.current &&
            enabled &&
            attemptReconnectRef.current
          ) {
            attemptReconnectRef.current();
          }
        } else {
          debugLog(`[useMessageSubscription] status ${status} for ${conversationId}`);
          if (onSubscriptionStatusChange) {
            onSubscriptionStatusChange(status);
          }
        }
      });

    channelRef.current = channel;
  }, [conversationId, user?.id, enabled, getReconnectDelay, onSubscriptionStatusChange]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!conversationId || !user?.id || !enabled) {
      // Clean up existing channel if disabled
      if (channelRef.current) {
        debugLog(`[useMessageSubscription] cleaning up disabled subscription: ${conversationId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      reconnectAttemptsRef.current = 0;
      setupInProgressRef.current = false;
      hasSubscribedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }

    // Only setup if not already subscribed
    if (!hasSubscribedRef.current) {
      setupSubscription();
    }

    return () => {
      isMountedRef.current = false;
      setupInProgressRef.current = false;
      hasSubscribedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, user?.id, enabled, setupSubscription]);
}
