'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

export interface Notification {
  id: string;
  type:
    | 'follow'
    | 'payment'
    | 'project_funded'
    | 'message'
    | 'comment'
    | 'like'
    | 'mention'
    | 'system';
  title: string;
  message: string | null;
  action_url: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  source_actor_id: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  source_actor?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    actor_type: string;
  } | null;
}

interface UseNotificationsOptions {
  filter?: 'all' | 'unread' | string;
  limit?: number;
  realtime?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  markAsRead: (id: string | string[] | 'all') => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing notifications
 *
 * Features:
 * - Fetch notifications with pagination
 * - Real-time updates via Supabase
 * - Mark as read (single, bulk, all)
 * - Delete notifications
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { filter = 'all', limit = 20, realtime = true } = options;
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (reset = false) => {
      if (!user) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const currentOffset = reset ? 0 : offset;
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: currentOffset.toString(),
          filter,
        });

        const response = await fetch(`/api/notifications?${params}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch notifications');
        }

        if (reset) {
          setNotifications(data.data.notifications);
          setOffset(limit);
        } else {
          setNotifications(prev => [...prev, ...data.data.notifications]);
          setOffset(prev => prev + limit);
        }
        setTotal(data.data.total);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    },
    [user, offset, limit, filter]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const response = await fetch('/api/notifications/unread');
      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (err) {
      logger.error('Failed to fetch unread count', err, 'Notifications');
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications(true);
      fetchUnreadCount();
    }
  }, [user, filter, fetchNotifications, fetchUnreadCount]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !realtime) {
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
        payload => {
          // Add new notification to the top
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          setTotal(prev => prev + 1);
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
        payload => {
          // Update notification in list
          setNotifications(prev =>
            prev.map(n => (n.id === payload.new.id ? { ...n, ...payload.new } : n))
          );
          // Recalculate unread count
          fetchUnreadCount();
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
        payload => {
          // Remove notification from list
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          setTotal(prev => prev - 1);
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, realtime, fetchUnreadCount]);

  // Load more
  const loadMore = useCallback(async () => {
    if (isLoading || notifications.length >= total) {
      return;
    }
    await fetchNotifications(false);
  }, [isLoading, notifications.length, total, fetchNotifications]);

  // Mark as read
  const markAsRead = useCallback(async (id: string | string[] | 'all') => {
    try {
      const body = id === 'all' ? { all: true } : Array.isArray(id) ? { ids: id } : { id };

      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      // Update local state
      if (id === 'all') {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      } else {
        const ids = Array.isArray(id) ? id : [id];
        setNotifications(prev =>
          prev.map(n =>
            ids.includes(n.id) ? { ...n, read: true, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - ids.length));
      }
    } catch (err) {
      logger.error('Failed to mark as read', err, 'Notifications');
      throw err;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      // Update local state
      setNotifications(prev => {
        const notification = prev.find(n => n.id === id);
        if (notification && !notification.read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n.id !== id);
      });
      setTotal(prev => prev - 1);
    } catch (err) {
      logger.error('Failed to delete notification', err, 'Notifications');
      throw err;
    }
  }, []);

  // Clear all read notifications
  const clearRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?clear=read', {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      // Update local state
      setNotifications(prev => prev.filter(n => !n.read));
      setTotal(prev => prev - (data.data.deleted || 0));
    } catch (err) {
      logger.error('Failed to clear read notifications', err, 'Notifications');
      throw err;
    }
  }, []);

  // Refresh
  const refresh = useCallback(async () => {
    await fetchNotifications(true);
    await fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore: notifications.length < total,
    loadMore,
    markAsRead,
    deleteNotification,
    clearRead,
    refresh,
  };
}

/**
 * Hook for just the unread notification count
 * Lighter weight for header badge
 */
export function useUnreadNotifications() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    // Initial fetch
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread');
        const data = await response.json();
        if (data.success) {
          setCount(data.data.count);
        }
      } catch (err) {
        logger.error('Failed to fetch notification count', err, 'Notifications');
      }
    };

    fetchCount();

    // Real-time subscription
    const supabase = createBrowserClient();

    const channel = supabase
      .channel('notification-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${user.id}`,
        },
        () => {
          // Refetch count on any change
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { count };
}
