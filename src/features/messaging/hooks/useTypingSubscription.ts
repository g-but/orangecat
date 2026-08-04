'use client';

import { useEffect, useRef, useState } from 'react';
import supabase from '@/lib/supabase/browser';
import { DATABASE_TABLES } from '@/config/database-tables';
import { debugLog } from '../lib/constants';
import type { Database } from '@/types/database';
import type { TypingUser } from './useTypingIndicator';

type TypingIndicatorRow = Database['public']['Tables']['typing_indicators']['Row'];
type ProfileData = { username?: string | null; name?: string | null };

interface UseTypingSubscriptionOptions {
  conversationId: string | null;
  userId: string | undefined;
  enabled: boolean;
  sendTypingStatus: (isTyping: boolean) => Promise<void>;
  refreshInterval: number;
  isTypingRef: React.MutableRefObject<boolean>;
}

export function useTypingSubscription({
  conversationId,
  userId,
  enabled,
  sendTypingStatus,
  refreshInterval,
  isTypingRef,
}: UseTypingSubscriptionOptions): TypingUser[] {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!conversationId || !userId || !enabled) {
      setTypingUsers([]);
      return;
    }

    // Capture ref object (not .current) so cleanup reads the live value at teardown time
    const typingRef = isTypingRef;

    const fetchTypingUsers = async () => {
      try {
        const { data } = await supabase
          .from(DATABASE_TABLES.TYPING_INDICATORS)
          .select('user_id, started_at, expires_at')
          .eq('conversation_id', conversationId)
          .neq('user_id', userId)
          .gt('expires_at', new Date().toISOString());

        if (data) {
          // `typing_indicators.user_id` is a foreign key to `auth.users`, not to
          // `profiles`, so PostgREST cannot embed the profile in the query above
          // — it has to be a second lookup.
          const typingUserIds = [...new Set(data.map(t => t.user_id))];
          const { data: profiles } = typingUserIds.length
            ? await supabase
                .from(DATABASE_TABLES.PROFILES)
                .select('id, username, name')
                .in('id', typingUserIds)
            : { data: [] };
          const profilesById = new Map((profiles ?? []).map(p => [p.id, p]));

          setTypingUsers(
            data
              .filter(t => profilesById.has(t.user_id))
              .map(t => ({
                userId: t.user_id,
                username: profilesById.get(t.user_id)?.username || '',
                name: profilesById.get(t.user_id)?.name || '',
                startedAt: new Date(t.started_at),
              }))
          );
        }
      } catch (error) {
        debugLog('[useTypingIndicator] error fetching typing users:', error);
      }
    };

    fetchTypingUsers();

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
            const oldRow = payload.old as TypingIndicatorRow;
            setTypingUsers(prev => prev.filter(u => u.userId !== oldRow.user_id));
          } else if (payload.new) {
            const newRow = payload.new as TypingIndicatorRow;
            if (newRow.user_id !== userId) {
              const typingUserId = newRow.user_id;
              const expiresAt = new Date(newRow.expires_at);
              if (expiresAt < new Date()) {
                setTypingUsers(prev => prev.filter(u => u.userId !== typingUserId));
                return;
              }
              const { data: profileData } = await supabase
                .from(DATABASE_TABLES.PROFILES)
                .select('username, name')
                .eq('id', typingUserId)
                .single();
              const profile = profileData as ProfileData | null;
              setTypingUsers(prev => {
                const existing = prev.find(u => u.userId === typingUserId);
                if (existing) {
                  return prev.map(u =>
                    u.userId === typingUserId ? { ...u, startedAt: new Date(newRow.started_at) } : u
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

    refreshIntervalRef.current = setInterval(() => {
      if (isTypingRef.current) {
        sendTypingStatus(true);
      }
      setTypingUsers(prev => prev.filter(u => Date.now() - u.startedAt.getTime() < 15000));
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
      if (typingRef.current) {
        sendTypingStatus(false);
      }
    };
  }, [conversationId, userId, enabled, sendTypingStatus, refreshInterval, isTypingRef]);

  return typingUsers;
}
