'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineQueueService } from '@/lib/offline-queue';
import { logger } from '@/utils/logger';
import { offlineQueueEvents } from '@/lib/offline-queue-events';
import { useAuth } from '@/hooks/useAuth';

interface OfflineQueueState {
  queuedPosts: any[];
  isOnline: boolean;
  queueLength: number;
  isSyncing: boolean;
  progress?: { processed: number; total: number };
}

/**
 * Hook to monitor the status of the offline post queue.
 * Provides real-time updates on queue length and online status.
 */
export function useOfflineQueue(): OfflineQueueState {
  const [queuedPosts, setQueuedPosts] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; total: number } | undefined>(
    undefined
  );
  const { user } = useAuth();

  const refreshQueue = useCallback(async () => {
    try {
      const queue = user?.id
        ? await offlineQueueService.getQueueByUser(user.id)
        : await offlineQueueService.getQueue();
      setQueuedPosts(queue);
    } catch (err) {
      logger.error('Failed to refresh offline queue', err, 'useOfflineQueue');
    }
  }, [user?.id]);

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

    // Also listen for custom events that our sync manager/lib dispatch
    const handleQueueUpdated = () => {
      refreshQueue();
    };
    window.addEventListener('offline-queue-updated', handleQueueUpdated); // legacy
    window.addEventListener(offlineQueueEvents.UPDATED, handleQueueUpdated);

    const handleSyncStart = (e: Event) => {
      const detail = (e as CustomEvent).detail as { total: number; processed: number } | undefined;
      setIsSyncing(true);
      setProgress({ processed: detail?.processed ?? 0, total: detail?.total ?? 0 });
    };
    const handleSyncProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail as { total: number; processed: number } | undefined;
      setIsSyncing(true);
      if (detail) setProgress({ processed: detail.processed ?? 0, total: detail.total ?? 0 });
    };
    const handleSyncComplete = () => {
      setIsSyncing(false);
      setProgress(undefined);
    };
    window.addEventListener(offlineQueueEvents.SYNC_START, handleSyncStart as EventListener);
    window.addEventListener(offlineQueueEvents.SYNC_PROGRESS, handleSyncProgress as EventListener);
    window.addEventListener(offlineQueueEvents.SYNC_COMPLETE, handleSyncComplete as EventListener);

    // Periodically refresh as a fallback
    const interval = setInterval(refreshQueue, 10000); // every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-updated', handleQueueUpdated);
      window.removeEventListener(offlineQueueEvents.UPDATED, handleQueueUpdated);
      window.removeEventListener(offlineQueueEvents.SYNC_START, handleSyncStart as EventListener);
      window.removeEventListener(
        offlineQueueEvents.SYNC_PROGRESS,
        handleSyncProgress as EventListener
      );
      window.removeEventListener(offlineQueueEvents.SYNC_COMPLETE, handleSyncComplete as EventListener);
      clearInterval(interval);
    };
  }, [refreshQueue]);

  return {
    queuedPosts,
    isOnline,
    queueLength: queuedPosts.length,
    isSyncing,
    progress,
  };
}
