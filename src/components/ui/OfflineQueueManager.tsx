'use client';

import React, { useCallback, useState } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import Button from '@/components/ui/Button';
import { offlineQueueService, type QueuedPost } from '@/lib/offline-queue';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';

interface OfflineQueueManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfflineQueueManager({ isOpen, onClose }: OfflineQueueManagerProps) {
  const { queuedPosts, isOnline, queueLength } = useOfflineQueue();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleRemove = useCallback(async (id: string) => {
    try {
      setBusyId(id);
      await offlineQueueService.removeFromQueue(id);
    } catch (e) {
      logger.error('Failed to remove queued post', e, 'OfflineQueueManager');
    } finally {
      setBusyId(current => (current === id ? null : current));
    }
  }, []);

  const handleRetry = useCallback(async (item: QueuedPost) => {
    try {
      setBusyId(item.id);
      const res = await timelineService.createEvent(item.payload);
      if (res?.success) {
        await offlineQueueService.removeFromQueue(item.id);
      } else {
        await offlineQueueService.incrementAttemptCount(item.id);
      }
    } catch (e: unknown) {
      logger.error('Retry failed', e, 'OfflineQueueManager');
      try {
        await offlineQueueService.incrementAttemptCount(item.id);
      } catch {}
    } finally {
      setBusyId(current => (current === item.id ? null : current));
    }
  }, []);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Offline Queue (${queueLength})`}>
      <div className="p-4 space-y-4">
        {!isOnline && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-900">
            You are offline. Queued posts will sync automatically when connection is restored.
          </div>
        )}

        {queuedPosts.length === 0 ? (
          <div className="text-sm text-gray-600">No queued posts.</div>
        ) : (
          <ul className="space-y-2">
            {queuedPosts.map((item: QueuedPost) => {
              const payload = item.payload as { title?: string; description?: string } | undefined;
              return (
                <li key={item.id} className="p-3 border rounded-md bg-white">
                  <div className="text-sm font-medium text-gray-900">
                    {payload?.title || 'Post'}
                  </div>
                  {payload?.description && (
                    <div className="text-sm text-gray-700 line-clamp-2">{payload.description}</div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Attempts: {item.attempts ?? 0} • Queued:{' '}
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(item.id)}
                      disabled={busyId === item.id}
                    >
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleRetry(item)}
                      disabled={busyId === item.id || !isOnline}
                    >
                      {busyId === item.id ? 'Working…' : 'Retry Now'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="pt-2 flex justify-end">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
