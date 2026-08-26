'use client';

import { useCallback, useState } from 'react';
import supabase from '@/lib/supabase/browser';
import { useAuth } from '@/hooks/useAuth';
import { DATABASE_TABLES } from '@/config/database-tables';
import { debugLog } from '../lib/constants';
import { usePresenceActivity } from './usePresenceActivity';

type PresenceStatus = 'online' | 'away' | 'offline';

interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: Date;
}

interface UsePresenceOptions {
  enabled?: boolean;
  heartbeatInterval?: number;
  awayTimeout?: number;
}

interface UsePresenceReturn {
  myStatus: PresenceStatus;
  setMyStatus: (status: PresenceStatus) => void;
  getPresence: (userIds: string[]) => Promise<Map<string, UserPresence>>;
  subscribeToPresence: (
    userIds: string[],
    callback: (presence: Map<string, UserPresence>) => void
  ) => () => void;
}

const DEFAULT_HEARTBEAT = 30000;
const DEFAULT_AWAY_TIMEOUT = 60000;

export function usePresence(options: UsePresenceOptions = {}): UsePresenceReturn {
  const { user } = useAuth();
  const {
    enabled = true,
    heartbeatInterval = DEFAULT_HEARTBEAT,
    awayTimeout = DEFAULT_AWAY_TIMEOUT,
  } = options;

  const [myStatus, setMyStatusState] = useState<PresenceStatus>('offline');

  const updatePresence = useCallback(
    async (status: PresenceStatus) => {
      if (!user?.id || !enabled) {
        return;
      }
      // Was an RPC to `update_presence`, a function that has never existed:
      // production answered PGRST202 and the error landed in the catch below, so
      // presence has never been written. A plain upsert needs no database
      // function at all — `user_presence` is keyed by user_id and its RLS
      // policies already allow exactly this ("Users can update their own
      // presence" INSERT, "Users can modify their own presence" UPDATE), which
      // is a stronger guarantee than a SECURITY DEFINER function that has to
      // re-implement the same check by hand.
      const now = new Date().toISOString();
      const { error } = await supabase
        .from(DATABASE_TABLES.USER_PRESENCE)
        .upsert({ user_id: user.id, status, last_seen_at: now, updated_at: now }, {
          onConflict: 'user_id',
        });

      if (error) {
        debugLog('[usePresence] error updating presence:', error);
        return;
      }
      setMyStatusState(status);
      debugLog('[usePresence] updated status:', status);
    },
    [user?.id, enabled]
  );

  const setMyStatus = useCallback(
    (status: PresenceStatus) => {
      updatePresence(status);
    },
    [updatePresence]
  );

  usePresenceActivity({
    userId: user?.id,
    enabled,
    heartbeatInterval,
    awayTimeout,
    myStatus,
    updatePresence,
  });

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

  const subscribeToPresence = useCallback(
    (userIds: string[], callback: (presence: Map<string, UserPresence>) => void): (() => void) => {
      if (!userIds.length) {
        return () => {};
      }

      getPresence(userIds).then(callback);

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
