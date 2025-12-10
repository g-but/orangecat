'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import supabase from '@/lib/supabase/browser';
import { useAuth } from '@/hooks/useAuth';

export function useMessagesUnread() {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchUnread = useCallback(async () => {
    if (!user?.id) {
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/messages', { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json();
      const conversations = Array.isArray(data.conversations) ? data.conversations : [];
      const total = conversations.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
      setCount(total);
    } catch {
      // ignore errors silently for badge
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('unread-messages-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Only increment if message is from someone else
          if (payload.new.sender_id !== user.id) {
            // Refetch to get accurate count
            fetchUnread();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
        },
        () => {
          // Refetch when participation changes (e.g., marking as read)
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

  // Also do a periodic refresh as backup (every 60 seconds instead of 30)
  useEffect(() => {
    const id = setInterval(fetchUnread, 60000);
    return () => clearInterval(id);
  }, [fetchUnread]);

  return { count, loading, refresh: fetchUnread };
}
