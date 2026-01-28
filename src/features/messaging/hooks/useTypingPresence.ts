'use client';

/**
 * Unified Typing + Presence Hook using Supabase Realtime Presence
 *
 * Provides real-time typing indicators and online presence using the
 * ephemeral Supabase Presence API for faster, more reliable updates.
 * This is an enhancement over the database-based approach.
 *
 * @module messaging/hooks/useTypingPresence
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import supabase from '@/lib/supabase/browser';
import { useAuth } from '@/hooks/useAuth';
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { debugLog } from '../lib/constants';

export type PresenceStatus = 'online' | 'away' | 'offline';

export interface UserPresenceState {
  user_id: string;
  username: string;
  avatar_url?: string;
  typing: boolean;
  online_at: string;
  status: PresenceStatus;
}

export interface TypingUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  startedAt: Date;
}

export interface OnlineUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  onlineAt: Date;
  status: PresenceStatus;
}

interface UseTypingPresenceOptions {
  /** Whether the hook is enabled */
  enabled?: boolean;
  /** Debounce time before marking as "stopped typing" (ms) */
  typingStopDelay?: number;
  /** Time before going "away" on blur (ms) */
  awayTimeout?: number;
}

interface UseTypingPresenceReturn {
  /** List of users currently typing (excluding current user) */
  typingUsers: TypingUser[];
  /** List of online users in this conversation */
  onlineUsers: OnlineUser[];
  /** Call when user starts typing */
  startTyping: () => void;
  /** Call when user stops typing (e.g., on blur or send) */
  stopTyping: () => void;
  /** Whether any other users are typing */
  isAnyoneTyping: boolean;
  /** Formatted typing text */
  typingText: string | null;
  /** Number of online users */
  onlineCount: number;
  /** Current user's presence status */
  myStatus: PresenceStatus;
  /** Set current user's status */
  setMyStatus: (status: PresenceStatus) => void;
}

const DEFAULT_TYPING_STOP_DELAY = 2000; // 2s of inactivity
const DEFAULT_AWAY_TIMEOUT = 60000; // 1 min before going "away"

export function useTypingPresence(
  conversationId: string | null,
  options: UseTypingPresenceOptions = {}
): UseTypingPresenceReturn {
  const { user, profile } = useAuth();
  const {
    enabled = true,
    typingStopDelay = DEFAULT_TYPING_STOP_DELAY,
    awayTimeout = DEFAULT_AWAY_TIMEOUT,
  } = options;

  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [myStatus, setMyStatusState] = useState<PresenceStatus>('online');

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  /**
   * Track current presence state to send to channel
   */
  const getPresenceState = useCallback(
    (typing: boolean, status: PresenceStatus): UserPresenceState => ({
      user_id: user?.id || '',
      username: profile?.username || 'Anonymous',
      avatar_url: profile?.avatar_url || undefined,
      typing,
      online_at: new Date().toISOString(),
      status,
    }),
    [user?.id, profile?.username, profile?.avatar_url]
  );

  /**
   * Update presence in channel
   */
  const updatePresence = useCallback(
    async (typing: boolean, status: PresenceStatus) => {
      if (!channelRef.current || !user?.id) {
        return;
      }

      try {
        await channelRef.current.track(getPresenceState(typing, status));
      } catch (error) {
        console.error('[useTypingPresence] Error tracking presence:', error);
      }
    },
    [user?.id, getPresenceState]
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
      updatePresence(true, myStatus);
    }

    // Set timeout to stop typing after inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        updatePresence(false, myStatus);
      }
    }, typingStopDelay);
  }, [enabled, conversationId, user?.id, updatePresence, myStatus, typingStopDelay]);

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
      updatePresence(false, myStatus);
    }
  }, [enabled, conversationId, user?.id, updatePresence, myStatus]);

  /**
   * Set status manually
   */
  const setMyStatus = useCallback(
    (status: PresenceStatus) => {
      setMyStatusState(status);
      updatePresence(isTypingRef.current, status);
    },
    [updatePresence]
  );

  /**
   * Handle visibility change (tab focus/blur)
   */
  useEffect(() => {
    if (!user?.id || !enabled || !conversationId) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Start away timeout when tab becomes hidden
        if (awayTimeoutRef.current) {
          clearTimeout(awayTimeoutRef.current);
        }
        awayTimeoutRef.current = setTimeout(() => {
          setMyStatusState('away');
          updatePresence(isTypingRef.current, 'away');
        }, awayTimeout);
      } else {
        // Cancel away timeout and go online when visible
        if (awayTimeoutRef.current) {
          clearTimeout(awayTimeoutRef.current);
          awayTimeoutRef.current = null;
        }
        setMyStatusState('online');
        updatePresence(isTypingRef.current, 'online');
      }
    };

    const handleWindowFocus = () => {
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
        awayTimeoutRef.current = null;
      }
      setMyStatusState('online');
      updatePresence(isTypingRef.current, 'online');
    };

    const handleWindowBlur = () => {
      awayTimeoutRef.current = setTimeout(() => {
        setMyStatusState('away');
        updatePresence(isTypingRef.current, 'away');
      }, awayTimeout);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);

      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
      }
    };
  }, [user?.id, enabled, conversationId, updatePresence, awayTimeout]);

  /**
   * Process presence state and update typing/online users
   */
  const processPresenceState = useCallback(
    (state: RealtimePresenceState<UserPresenceState>) => {
      const currentUserId = user?.id;
      const typing: TypingUser[] = [];
      const online: OnlineUser[] = [];

      // Iterate over all presence keys
      for (const [, presences] of Object.entries(state)) {
        for (const presence of presences) {
          const p = presence as unknown as UserPresenceState;

          // Skip current user
          if (p.user_id === currentUserId) {
            continue;
          }

          // Add to online users
          online.push({
            userId: p.user_id,
            username: p.username,
            avatarUrl: p.avatar_url,
            onlineAt: new Date(p.online_at),
            status: p.status,
          });

          // Add to typing users if typing
          if (p.typing) {
            typing.push({
              userId: p.user_id,
              username: p.username,
              avatarUrl: p.avatar_url,
              startedAt: new Date(p.online_at),
            });
          }
        }
      }

      setTypingUsers(typing);
      setOnlineUsers(online);
    },
    [user?.id]
  );

  /**
   * Set up presence channel subscription
   */
  useEffect(() => {
    if (!conversationId || !user?.id || !enabled) {
      setTypingUsers([]);
      setOnlineUsers([]);
      return;
    }

    // Create presence channel for this conversation
    const channel = supabase.channel(`conversation:${conversationId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<UserPresenceState>();
        processPresenceState(state);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // User joined
        for (const presence of newPresences) {
          const p = presence as unknown as UserPresenceState;
          if (p.user_id !== user.id) {
            debugLog(`[useTypingPresence] ${p.username} joined`);
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // User left
        for (const presence of leftPresences) {
          const p = presence as unknown as UserPresenceState;
          if (p.user_id !== user.id) {
            debugLog(`[useTypingPresence] ${p.username} left`);
          }
        }
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          // Track our presence once subscribed
          await channel.track(getPresenceState(false, 'online'));
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, user?.id, enabled, processPresenceState, getPresenceState]);

  /**
   * Format typing text like Facebook Messenger
   */
  const typingText =
    typingUsers.length === 0
      ? null
      : typingUsers.length === 1
        ? `${typingUsers[0].username} is typing...`
        : typingUsers.length === 2
          ? `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`
          : `${typingUsers.length} people are typing...`;

  return {
    typingUsers,
    onlineUsers,
    startTyping,
    stopTyping,
    isAnyoneTyping: typingUsers.length > 0,
    typingText,
    onlineCount: onlineUsers.length,
    myStatus,
    setMyStatus,
  };
}

export default useTypingPresence;
