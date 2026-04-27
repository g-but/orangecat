'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Notification } from './useNotifications';

interface Props {
  user: User | null;
  enabled: boolean;
  onInsert: (notification: Notification) => void;
  onUpdate: (updated: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}

export function useNotificationsRealtime({ user, enabled, onInsert, onUpdate, onDelete }: Props) {
  useEffect(() => {
    if (!user || !enabled) {
      return;
    }

    const supabase = createBrowserClient();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${user.id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          onInsert(payload.new as unknown as Notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${user.id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          onUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${user.id}`,
        },
        (payload: { old: { id: string } }) => {
          onDelete(payload.old.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, enabled, onInsert, onUpdate, onDelete]);
}
