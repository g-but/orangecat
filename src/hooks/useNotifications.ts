'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { API_ROUTES } from '@/config/api-routes';
import { useNotificationsMutations } from './useNotificationsMutations';
import { useNotificationsRealtime } from './useNotificationsRealtime';

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
    | 'system'
    | 'task_attention'
    | 'task_request'
    | 'task_completed'
    | 'task_broadcast';
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
    actor_type: string;
    user_id: string | null;
    profiles: { name: string | null; avatar_url: string | null } | null;
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

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { filter = 'all', limit = 20, realtime = true } = options;
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

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

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const response = await fetch(API_ROUTES.NOTIFICATIONS.UNREAD);
      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (err) {
      logger.error('Failed to fetch unread count', err, 'Notifications');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications(true);
      fetchUnreadCount();
    }
  }, [user, filter, fetchNotifications, fetchUnreadCount]);

  const handleInsert = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    setTotal(prev => prev + 1);
  }, []);

  const handleUpdate = useCallback(
    (updated: Record<string, unknown>) => {
      setNotifications(prev =>
        prev.map(n => (n.id === (updated as { id: string }).id ? { ...n, ...updated } : n))
      );
      fetchUnreadCount();
    },
    [fetchUnreadCount]
  );

  const handleDelete = useCallback(
    (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
      fetchUnreadCount();
    },
    [fetchUnreadCount]
  );

  useNotificationsRealtime({
    user,
    enabled: realtime,
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
  });

  const loadMore = useCallback(async () => {
    if (isLoading || notifications.length >= total) {
      return;
    }
    await fetchNotifications(false);
  }, [isLoading, notifications.length, total, fetchNotifications]);

  const { markAsRead, deleteNotification, clearRead } = useNotificationsMutations({
    setNotifications,
    setUnreadCount,
    setTotal,
  });

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
