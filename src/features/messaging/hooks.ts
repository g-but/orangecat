'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { Conversation } from './types';
import supabase from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useMessagingStore } from '@/stores/messaging';
import { API_ROUTES, CHANNELS, TIMING, debugLog } from './lib/constants';

export function useConversations(searchQuery: string, selectedConversationId?: string | null) {
  const { user, hydrated, isLoading: authLoading, isAuthenticated } = useAuth();
  const isAuthReady = hydrated && !authLoading;

  // Use centralized messaging store
  const {
    conversations,
    setConversations,
    setLoading: setStoreLoading,
    setError: setStoreError,
  } = useMessagingStore();

  debugLog('[useConversations] state', {
    user: !!user,
    hydrated,
    authLoading,
    isAuthenticated,
    isAuthReady,
    userId: user?.id,
    conversationsCount: Array.isArray(conversations) ? conversations.length : 'NOT_ARRAY',
    conversationsType: typeof conversations,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const hasInitialFetch = useRef(false);
  const realtimeSetup = useRef(false);
  const lastSessionSync = useRef<number>(0);

  const refresh = useCallback(async () => {
    debugLog('[useConversations] refresh', { isAuthReady, hasUser: !!user });
    if (!isAuthReady || !user) {
      debugLog('[useConversations] skip refresh (auth not ready or no user)');
      return;
    }

    try {
      setError(null);
      setRefreshing(true);
      debugLog('[useConversations] fetching conversations');
      let res = await fetch(`${API_ROUTES.CONVERSATIONS}?limit=30`, { credentials: 'same-origin' });
      debugLog('[useConversations] response status', { status: res.status, text: res.statusText });

      // If unauthorized, try to sync the session from localStorage (with throttling)
      if (res.status === 401) {
        const now = Date.now();
        // Only sync once every 30 seconds to prevent excessive sync attempts
        if (now - lastSessionSync.current > 30000) {
          debugLog('[useConversations] 401; syncing session');
          lastSessionSync.current = now;
          try {
            // Import supabase client dynamically to avoid circular imports
            const { default: supabase } = await import('@/lib/supabase/browser');
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session?.access_token) {
              const syncRes = await fetch('/api/auth/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  accessToken: session.access_token,
                  refreshToken: session.refresh_token,
                }),
              });

              if (syncRes.ok) {
                debugLog('[useConversations] session synced; retrying');
                // Retry the original request
                res = await fetch(`${API_ROUTES.CONVERSATIONS}?limit=30`, {
                  credentials: 'same-origin',
                });
                debugLog('[useConversations] retry status', {
                  status: res.status,
                  text: res.statusText,
                });
              } else {
                debugLog(
                  '[useConversations] session sync failed:',
                  syncRes.status,
                  syncRes.statusText
                );
              }
            } else {
              debugLog('[useConversations] no session available for sync');
            }
          } catch (syncError) {
            console.error('[useConversations] Failed to sync session:', syncError);
          }
        } else {
          debugLog('[useConversations] skipping session sync (throttled)');
        }
      }

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        debugLog('[useConversations] error response', t);
        // Don't show error toast for 401 - that's expected during auth transitions
        if (res.status !== 401) {
          setError('Failed to load conversations');
          if (t) {
            toast.error('Failed to load conversations', { description: t });
          }
        }
        // Clear conversations when API fails (user not authenticated)
        setConversations([]);
        return;
      }
      const data = await res.json().catch(() => ({ conversations: [] }));
      debugLog('[useConversations] data', {
        count: Array.isArray(data.conversations) ? data.conversations.length : 0,
      });

      // Ensure we have a valid conversations array, even if the API returns an error
      const conversations = (
        Array.isArray(data?.conversations) ? data.conversations : []
      ) as Conversation[];
      const uniqueConversations = Array.from(
        new Map(conversations.map((c: Conversation) => [c.id, c])).values()
      );
      debugLog('[useConversations] set conversations', uniqueConversations.length);
      setConversations(uniqueConversations);
      setLastFetch(Date.now());
    } catch (e) {
      console.error('[useConversations] Network error:', e);
      setError('Network error');
      // Clear conversations on network error
      setConversations([]);
      toast.error('Network error loading conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthReady, user]);

  // Initial load - always fetch for development
  useEffect(() => {
    if (!hasInitialFetch.current) {
      hasInitialFetch.current = true;
      refresh();
    }
  }, [refresh]);

  // Ensure selected conversation appears in the list (summary endpoint)
  useEffect(() => {
    const ensureSelected = async () => {
      if (!selectedConversationId) {
        return;
      }
      if (
        Array.isArray(conversations) &&
        conversations.some(c => c.id === selectedConversationId)
      ) {
        return;
      }
      try {
        const res = await fetch(`/api/messages/${selectedConversationId}/summary`, {
          credentials: 'same-origin',
        });
        if (!res.ok) {
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (data?.conversation) {
          const safeConversations = Array.isArray(conversations) ? conversations : [];
          setConversations([data.conversation as Conversation, ...safeConversations]);
        }
      } catch {
        // ignore
      }
    };
    ensureSelected();
  }, [selectedConversationId]);

  // Realtime: debounce refresh calls to avoid bursts
  useEffect(() => {
    if (!isAuthReady || !user) {
      debugLog('[useConversations] skip realtime (auth not ready)');
      return;
    }

    // Prevent multiple realtime setups
    if (realtimeSetup.current) {
      debugLog('[useConversations] realtime already setup, skipping');
      return;
    }
    realtimeSetup.current = true;

    let timeout: any = null;
    const reqRefresh = () => {
      const now = Date.now();
      const elapsed = now - lastFetch;
      if (elapsed < TIMING.REFRESH_DEBOUNCE_MS || refreshing) {
        clearTimeout(timeout);
        timeout = setTimeout(() => refresh(), Math.max(0, TIMING.REFRESH_DEBOUNCE_MS - elapsed));
      } else {
        refresh();
      }
    };
    const channel = supabase
      .channel(CHANNELS.CONVERSATIONS_LIST)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, reqRefresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, reqRefresh)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversation_participants' },
        reqRefresh
      )
      .subscribe();
    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
      realtimeSetup.current = false;
    };
  }, [refresh, lastFetch, refreshing, isAuthReady, user]);

  // Client filtering
  const filtered = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    if (!q) {
      return Array.isArray(conversations) ? conversations : [];
    }
    if (!Array.isArray(conversations)) {
      return [];
    }
    return conversations.filter(c => {
      if (c.title && c.title.toLowerCase().includes(q)) {
        return true;
      }
      return (c.participants || []).some(
        p =>
          (p.name || '').toLowerCase().includes(q) || (p.username || '').toLowerCase().includes(q)
      );
    });
  }, [conversations, searchQuery]);

  const removeLocal = useCallback(
    (ids: string[]) => {
      if (!Array.isArray(ids) || ids.length === 0) {
        return;
      }
      const safeConversations = Array.isArray(conversations) ? conversations : [];
      setConversations(safeConversations.filter(c => !ids.includes(c.id)));
    },
    [conversations, setConversations]
  );

  return { conversations: filtered, loading, error, refresh, removeLocal };
}
