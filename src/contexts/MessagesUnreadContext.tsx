'use client';

/**
 * Messages Unread Count Context
 *
 * Singleton pattern to share unread message count across all components.
 * Prevents multiple API calls and subscriptions.
 *
 * Created: 2025-01-21
 * Last Modified: 2025-01-21
 * Last Modified Summary: Initial implementation for performance optimization
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import supabase from '@/lib/supabase/browser';
import { useAuth } from '@/hooks/useAuth';

interface MessagesUnreadContextType {
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const MessagesUnreadContext = createContext<MessagesUnreadContextType>({
  count: 0,
  loading: true,
  refresh: async () => {},
});

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function MessagesUnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchRef = useRef<number>(0);

  const fetchUnread = useCallback(async () => {
    // Prevent concurrent requests
    if (isFetchingRef.current) {
      return;
    }

    if (!user?.id) {
      setCount(0);
      setLoading(false);
      return;
    }

    isFetchingRef.current = true;
    lastFetchRef.current = Date.now();

    try {
      // Try to sync session first if this is the first request and we're getting auth errors
      let res = await fetch('/api/messages/unread-count', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      // If unauthorized, try to sync the session from localStorage
      if (res.status === 401) {
        console.log('Unread count: Got 401, trying to sync session...');
        try {
          // Get session from Supabase client
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
              console.log('Session synced successfully, retrying unread count...');
              // Retry the original request
              res = await fetch('/api/messages/unread-count', {
                credentials: 'same-origin',
                cache: 'no-store',
              });
            }
          }
        } catch (syncError) {
          console.error('Failed to sync session:', syncError);
        }
      }

      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setCount(data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      // Don't update count on error to avoid flickering
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]);

  // Debounced version for real-time events
  // Create debounced function that references the latest fetchUnread
  const debouncedFetchRef = useRef<(() => void) | null>(null);

  // Update debounced function when fetchUnread changes
  useEffect(() => {
    debouncedFetchRef.current = debounce(() => {
      // Only fetch if enough time has passed since last fetch
      const elapsed = Date.now() - lastFetchRef.current;
      if (elapsed > 500) {
        fetchUnread();
      }
    }, 500);
  }, [fetchUnread]);

  // Initial fetch
  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  // Real-time subscription - single instance for entire app
  useEffect(() => {
    if (!user?.id) {
      // Clean up on logout
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('unread-messages-global-singleton')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        payload => {
          // Only update if message is from someone else
          if (payload.new.sender_id !== user.id && debouncedFetchRef.current) {
            debouncedFetchRef.current();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
        },
        payload => {
          // Only refresh if last_read_at changed (marking as read)
          if (payload.new?.last_read_at && debouncedFetchRef.current) {
            console.log('[MessagesUnreadContext] Conversation marked as read, refreshing count');
            debouncedFetchRef.current();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_participants',
        },
        () => {
          // Refresh when new participant added
          if (debouncedFetchRef.current) {
            debouncedFetchRef.current();
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, fetchUnread]);

  // Periodic refresh as backup (only if real-time fails)
  // Reduced to 30 seconds for better responsiveness
  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const id = setInterval(() => {
      // Only poll if real-time hasn't updated recently (backup mechanism)
      const elapsed = Date.now() - lastFetchRef.current;
      if (elapsed > 30000) {
        // 30 seconds
        console.log('[MessagesUnreadContext] Periodic refresh (backup)');
        fetchUnread();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(id);
  }, [user?.id, fetchUnread]);

  return (
    <MessagesUnreadContext.Provider value={{ count, loading, refresh: fetchUnread }}>
      {children}
    </MessagesUnreadContext.Provider>
  );
}

export function useMessagesUnread() {
  const context = useContext(MessagesUnreadContext);
  if (!context) {
    // Fallback for components outside provider (shouldn't happen, but graceful degradation)
    return { count: 0, loading: false, refresh: async () => {} };
  }
  return context;
}
