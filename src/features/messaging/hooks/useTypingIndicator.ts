'use client';

/**
 * Typing Indicator Hook
 *
 * Provides real-time typing indicators like Facebook Messenger.
 * Automatically sends typing status when user types and cleans up on stop.
 *
 * @module messaging/hooks/useTypingIndicator
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import supabase from '@/lib/supabase/browser';
import { useAuth } from '@/hooks/useAuth';
import { debugLog } from '../lib/constants';
import type { Database } from '@/types/database';

// Type for typing_indicators table row
type TypingIndicatorRow = Database['public']['Tables']['typing_indicators']['Row'];

interface TypingUser {
  userId: string;
  username: string;
  name: string;
  startedAt: Date;
}

interface UseTypingIndicatorOptions {
  /** Whether the hook is enabled */
  enabled?: boolean;
  /** Debounce time before sending "stopped typing" (ms) */
  stopDelay?: number;
  /** How often to refresh "still typing" status (ms) */
  refreshInterval?: number;
}

interface UseTypingIndicatorReturn {
  /** List of users currently typing */
  typingUsers: TypingUser[];
  /** Call when user starts typing */
  startTyping: () => void;
  /** Call when user stops typing (e.g., on blur or send) */
  stopTyping: () => void;
  /** Whether any users are typing */
  isAnyoneTyping: boolean;
  /** Formatted display text like "Alice is typing..." */
  typingText: string | null;
}

const DEFAULT_STOP_DELAY = 2000; // Stop typing after 2s of inactivity
const DEFAULT_REFRESH_INTERVAL = 5000; // Refresh typing status every 5s

export function useTypingIndicator(
  conversationId: string | null,
  options: UseTypingIndicatorOptions = {}
): UseTypingIndicatorReturn {
  const { user } = useAuth();
  const {
    enabled = true,
    stopDelay = DEFAULT_STOP_DELAY,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
  } = options;

  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  /**
   * Send typing indicator to server
   */
  const sendTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!conversationId || !user?.id || !enabled) {
        return;
      }

      try {
        await supabase.rpc('set_typing_indicator', {
          p_conversation_id: conversationId,
          p_user_id: user.id,
          p_is_typing: isTyping,
        });
        debugLog('[useTypingIndicator] sent typing status:', isTyping);
      } catch (error) {
        // Silently fail - typing indicators are not critical
        debugLog('[useTypingIndicator] error sending typing status:', error);
      }
    },
    [conversationId, user?.id, enabled]
  );

  /**
   * Start typing - call on keypress
   */
  const startTyping = useCallback(() => {
    if (!enabled || !conversationId || !user?.id) {
      return;
    }

    // Clear any pending stop timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Only send if not already typing
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingStatus(true);
    }

    // Set timeout to stop typing after inactivity
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingStatus(false);
    }, stopDelay);
  }, [enabled, conversationId, user?.id, sendTypingStatus, stopDelay]);

  /**
   * Stop typing - call on blur, send, etc.
   */
  const stopTyping = useCallback(() => {
    if (!enabled || !conversationId || !user?.id) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTypingStatus(false);
    }
  }, [enabled, conversationId, user?.id, sendTypingStatus]);

  /**
   * Subscribe to typing indicators from other users
   */
  useEffect(() => {
    if (!conversationId || !user?.id || !enabled) {
      setTypingUsers([]);
      return;
    }

    // Fetch initial typing users
    const fetchTypingUsers = async () => {
      try {
        const { data } = await supabase
          .from('typing_indicators')
          .select(
            `
            user_id,
            started_at,
            expires_at,
            profiles:user_id (username, name)
          `
          )
          .eq('conversation_id', conversationId)
          .neq('user_id', user.id)
          .gt('expires_at', new Date().toISOString());

        if (data) {
          setTypingUsers(
            data
              .filter((t: any) => t.profiles)
              .map((t: any) => ({
                userId: t.user_id,
                username: t.profiles?.username || '',
                name: t.profiles?.name || '',
                startedAt: new Date(t.started_at),
              }))
          );
        }
      } catch (error) {
        debugLog('[useTypingIndicator] error fetching typing users:', error);
      }
    };

    fetchTypingUsers();

    // Subscribe to changes
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async payload => {
          debugLog('[useTypingIndicator] typing change:', payload.eventType);

          if (payload.eventType === 'DELETE') {
            // Remove from typing users
            const oldRow = payload.old as TypingIndicatorRow;
            setTypingUsers(prev => prev.filter(u => u.userId !== oldRow.user_id));
          } else if (payload.new) {
            const newRow = payload.new as TypingIndicatorRow;
            if (newRow.user_id !== user.id) {
              // Add or update typing user
              const typingUserId = newRow.user_id;
              const expiresAt = new Date(newRow.expires_at);

              // Check if expired
              if (expiresAt < new Date()) {
                setTypingUsers(prev => prev.filter(u => u.userId !== typingUserId));
                return;
              }

              // Fetch profile if needed
              const { data: profile } = await supabase
                .from('profiles')
                .select('username, name')
                .eq('id', typingUserId)
                .single();

              setTypingUsers(prev => {
                const existing = prev.find(u => u.userId === typingUserId);
                if (existing) {
                  return prev.map(u =>
                    u.userId === typingUserId
                      ? { ...u, startedAt: new Date(newRow.started_at) }
                      : u
                  );
                }
                return [
                  ...prev,
                  {
                    userId: typingUserId,
                    username: profile?.username || '',
                    name: profile?.name || '',
                    startedAt: new Date(newRow.started_at),
                  },
                ];
              });
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Refresh typing status periodically to keep it alive while typing
    refreshIntervalRef.current = setInterval(() => {
      if (isTypingRef.current) {
        sendTypingStatus(true);
      }
      // Also clean up expired typing users
      setTypingUsers(prev =>
        prev.filter(u => {
          const age = Date.now() - u.startedAt.getTime();
          return age < 15000; // Remove if no update for 15s
        })
      );
    }, refreshInterval);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      // Clean up typing status on unmount
      if (isTypingRef.current) {
        sendTypingStatus(false);
      }
    };
  }, [conversationId, user?.id, enabled, sendTypingStatus, refreshInterval]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Format typing text like Facebook Messenger
   */
  const typingText =
    typingUsers.length === 0
      ? null
      : typingUsers.length === 1
        ? `${typingUsers[0].name || typingUsers[0].username} is typing...`
        : typingUsers.length === 2
          ? `${typingUsers[0].name || typingUsers[0].username} and ${typingUsers[1].name || typingUsers[1].username} are typing...`
          : `${typingUsers.length} people are typing...`;

  return {
    typingUsers,
    startTyping,
    stopTyping,
    isAnyoneTyping: typingUsers.length > 0,
    typingText,
  };
}
