'use client';

/**
 * User Presence Hook
 *
 * Provides online/offline/away status like Facebook Messenger.
 * Automatically updates presence on window focus/blur and periodically.
 *
 * @module messaging/hooks/usePresence
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import supabase from '@/lib/supabase/browser';
import { useAuth } from '@/hooks/useAuth';
import { DATABASE_TABLES } from '@/config/database-tables';
import { debugLog } from '../lib/constants';

type PresenceStatus = 'online' | 'away' | 'offline';

interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: Date;
}

interface UsePresenceOptions {
  /** Whether the hook is enabled */
  enabled?: boolean;
  /** How often to heartbeat (ms) */
  heartbeatInterval?: number;
  /** Time before going "away" on blur (ms) */
  awayTimeout?: number;
}

interface UsePresenceReturn {
  /** Current user's presence status */
  myStatus: PresenceStatus;
  /** Set own status manually */
  setMyStatus: (status: PresenceStatus) => void;
  /** Get presence for specific user IDs */
  getPresence: (userIds: string[]) => Promise<Map<string, UserPresence>>;
  /** Subscribe to presence changes for specific users */
  subscribeToPresence: (
    userIds: string[],
    callback: (presence: Map<string, UserPresence>) => void
  ) => () => void;
}

const DEFAULT_HEARTBEAT = 30000; // 30s
const DEFAULT_AWAY_TIMEOUT = 60000; // 1 min

export function usePresence(options: UsePresenceOptions = {}): UsePresenceReturn {
  const { user } = useAuth();
  const {
    enabled = true,
    heartbeatInterval = DEFAULT_HEARTBEAT,
    awayTimeout = DEFAULT_AWAY_TIMEOUT,
  } = options;

  const [myStatus, setMyStatusState] = useState<PresenceStatus>('offline');
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Update presence in database
   */
  const updatePresence = useCallback(
    async (status: PresenceStatus) => {
      if (!user?.id || !enabled) {
        return;
      }

      try {
        await (supabase.rpc as any)('update_presence', { p_status: status });
        setMyStatusState(status);
        debugLog('[usePresence] updated status:', status);
      } catch (error) {
        debugLog('[usePresence] error updating presence:', error);
      }
    },
    [user?.id, enabled]
  );

  /**
   * Set status manually
   */
  const setMyStatus = useCallback(
    (status: PresenceStatus) => {
      updatePresence(status);
    },
    [updatePresence]
  );

  /**
   * Handle visibility change (tab focus/blur)
   */
  useEffect(() => {
    if (!user?.id || !enabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Start away timeout when tab becomes hidden
        if (awayTimeoutRef.current) {
          clearTimeout(awayTimeoutRef.current);
        }
        awayTimeoutRef.current = setTimeout(() => {
          updatePresence('away');
        }, awayTimeout);
      } else {
        // Cancel away timeout and go online when visible
        if (awayTimeoutRef.current) {
          clearTimeout(awayTimeoutRef.current);
          awayTimeoutRef.current = null;
        }
        updatePresence('online');
      }
    };

    const handleWindowFocus = () => {
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
        awayTimeoutRef.current = null;
      }
      updatePresence('online');
    };

    const handleWindowBlur = () => {
      awayTimeoutRef.current = setTimeout(() => {
        updatePresence('away');
      }, awayTimeout);
    };

    // Set initial online status
    updatePresence('online');

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    // Heartbeat to keep presence alive
    heartbeatRef.current = setInterval(() => {
      if (!document.hidden && myStatus !== 'offline') {
        updatePresence(myStatus === 'away' ? 'away' : 'online');
      }
    }, heartbeatInterval);

    // Set offline on page unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline update
      navigator.sendBeacon?.('/api/presence/offline', JSON.stringify({ userId: user.id }));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
      }

      // Go offline on cleanup
      updatePresence('offline');
    };
  }, [user?.id, enabled, updatePresence, heartbeatInterval, awayTimeout, myStatus]);

  /**
   * Get presence for specific users
   */
  const getPresence = useCallback(async (userIds: string[]): Promise<Map<string, UserPresence>> => {
    const map = new Map<string, UserPresence>();
    if (!userIds.length) {
      return map;
    }

    try {
      const { data } = await supabase
        .from(DATABASE_TABLES.USER_PRESENCE)
        .select('user_id, status, last_seen_at')
        .in('user_id', userIds);

      if (data) {
        type PresenceRow = { user_id: string; status: string; last_seen_at: string };
        for (const row of data as PresenceRow[]) {
          map.set(row.user_id, {
            userId: row.user_id,
            status: row.status as PresenceStatus,
            lastSeenAt: new Date(row.last_seen_at),
          });
        }
      }

      // Fill in missing users as offline
      for (const userId of userIds) {
        if (!map.has(userId)) {
          map.set(userId, {
            userId,
            status: 'offline',
            lastSeenAt: new Date(0),
          });
        }
      }
    } catch (error) {
      debugLog('[usePresence] error fetching presence:', error);
    }

    return map;
  }, []);

  /**
   * Subscribe to presence changes for specific users
   */
  const subscribeToPresence = useCallback(
    (userIds: string[], callback: (presence: Map<string, UserPresence>) => void): (() => void) => {
      if (!userIds.length) {
        return () => {};
      }

      // Initial fetch
      getPresence(userIds).then(callback);

      // Subscribe to changes
      const channel = supabase
        .channel(`presence:${userIds.join(',')}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_presence',
          },
          async payload => {
            interface PresenceRow {
              user_id: string;
              status: string;
              last_seen_at?: string;
            }
            const newRow = payload.new as PresenceRow | null;
            const oldRow = payload.old as PresenceRow | null;
            const changedUserId = newRow?.user_id || oldRow?.user_id;
            if (changedUserId && userIds.includes(changedUserId)) {
              // Refetch all presence data
              const updated = await getPresence(userIds);
              callback(updated);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [getPresence]
  );

  return {
    myStatus,
    setMyStatus,
    getPresence,
    subscribeToPresence,
  };
}

/**
 * Format last seen time like Messenger
 */
export function formatLastSeen(lastSeenAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - lastSeenAt.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return 'Active now';
  }
  if (minutes < 60) {
    return `Active ${minutes}m ago`;
  }
  if (hours < 24) {
    return `Active ${hours}h ago`;
  }
  if (days === 1) {
    return 'Active yesterday';
  }
  if (days < 7) {
    return `Active ${days}d ago`;
  }
  return lastSeenAt.toLocaleDateString();
}
