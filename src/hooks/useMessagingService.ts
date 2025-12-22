'use client';

/**
 * MESSAGING SERVICE HOOK
 *
 * Manages unread count subscriptions and updates the centralized store.
 * Replaces MessagesUnreadContext functionality.
 */

import { useEffect, useCallback, useRef } from 'react';
import supabase from '@/lib/supabase/browser';
import { useAuth } from './useAuth';
import { messagingActions } from '@/stores/messaging';
import { debugLog } from '@/features/messaging/lib/constants';

export function useMessagingService() {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchRef = useRef<number>(0);

  // Fetch unread count
  const fetchUnread = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    if (!user?.id) {
      messagingActions.setUnreadCount(0);
      return;
    }

    isFetchingRef.current = true;
    lastFetchRef.current = Date.now();

    try {
      const res = await fetch('/api/messages/unread-count', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        messagingActions.setUnreadCount(data.count || 0);
      }
    } catch (error) {
      debugLog('[MessagingService] Failed to fetch unread count:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [user?.id]);

  // Setup real-time subscriptions
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

    // Initial fetch
    fetchUnread();

    // Setup real-time subscription
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
          if (payload.new.sender_id !== user.id) {
            fetchUnread();
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
          if (payload.new?.last_read_at) {
            debugLog('[MessagingService] Conversation marked as read, refreshing count');
            fetchUnread();
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
          fetchUnread();
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

  return {
    refreshUnreadCount: fetchUnread,
  };
}
