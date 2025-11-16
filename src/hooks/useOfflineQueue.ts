'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineQueueService } from '@/lib/offline-queue';
import { logger } from '@/utils/logger';

interface OfflineQueueState {
  queuedPosts: any[];
  isOnline: boolean;
  queueLength: number;
}

/**
 * Hook to monitor the status of the offline post queue.
 * Provides real-time updates on queue length and online status.
 */
export function useOfflineQueue(): OfflineQueueState {
  const [queuedPosts, setQueuedPosts] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const refreshQueue = useCallback(async () => {
    try {
      const queue = await offlineQueueService.getQueue();
      setQueuedPosts(queue);
    } catch (err) {
      logger.error('Failed to refresh offline queue', err, 'useOfflineQueue');
    }
  }, []);

  useEffect(() => {
    // Initial check
    if (typeof window !== 'undefined' && 'onLine' in navigator) {
      setIsOnline(navigator.onLine);
    }
    refreshQueue();

    // Set up listeners
    const handleOnline = () => {
      setIsOnline(true);
      refreshQueue(); // Refresh queue when coming online
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also listen for a custom event that our sync manager can dispatch
    const handleQueueUpdated = () => {
      refreshQueue();
    };
    window.addEventListener('offline-queue-updated', handleQueueUpdated);

    // Periodically refresh as a fallback
    const interval = setInterval(refreshQueue, 10000); // every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-updated', handleQueueUpdated);
      clearInterval(interval);
    };
  }, [refreshQueue]);

  return {
    queuedPosts,
    isOnline,
    queueLength: queuedPosts.length,
  };
}

/**
 * Dispatches a custom event to notify UI components that the queue has changed.
 */
export function dispatchQueueUpdatedEvent() {
  window.dispatchEvent(new CustomEvent('offline-queue-updated'));
}
