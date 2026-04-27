'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { logger } from '@/utils/logger';
import { API_ROUTES } from '@/config/api-routes';
import type { Notification } from './useNotifications';

interface MutationSetters {
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  setUnreadCount: Dispatch<SetStateAction<number>>;
  setTotal: Dispatch<SetStateAction<number>>;
}

export interface UseNotificationsMutationsReturn {
  markAsRead: (id: string | string[] | 'all') => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearRead: () => Promise<void>;
}

export function useNotificationsMutations({
  setNotifications,
  setUnreadCount,
  setTotal,
}: MutationSetters): UseNotificationsMutationsReturn {
  const markAsRead = useCallback(
    async (id: string | string[] | 'all') => {
      try {
        const body = id === 'all' ? { all: true } : Array.isArray(id) ? { ids: id } : { id };

        const response = await fetch(API_ROUTES.NOTIFICATIONS.READ, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error);
        }

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
    },
    [setNotifications, setUnreadCount]
  );

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/notifications?id=${id}`, {
          method: 'DELETE',
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error);
        }

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
    },
    [setNotifications, setUnreadCount, setTotal]
  );

  const clearRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?clear=read', {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      setNotifications(prev => prev.filter(n => !n.read));
      setTotal(prev => prev - (data.data.deleted || 0));
    } catch (err) {
      logger.error('Failed to clear read notifications', err, 'Notifications');
      throw err;
    }
  }, [setNotifications, setTotal]);

  return { markAsRead, deleteNotification, clearRead };
}
