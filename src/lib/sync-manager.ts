// src/lib/sync-manager.ts

import { logger } from '@/utils/logger';
import { offlineQueueService } from './offline-queue';
import { timelineService } from '@/services/timeline';
import { queueUpdated, syncStart, syncProgress, syncComplete } from '@/lib/offline-queue-events';

const MAX_SYNC_ATTEMPTS = 5;
let isSyncing = false;
let currentUserId: string | null = null;
let scheduledRetry: ReturnType<typeof setTimeout> | null = null;

function setCurrentUser(id: string | null) {
  currentUserId = id;
}

function classifyError(err: any): 'permanent' | 'transient' {
  const status = err?.response?.status ?? err?.status;
  if (typeof status === 'number') {
    if ([400, 401, 403, 404].includes(status)) {
      return 'permanent';
    }
    if (status === 429 || status >= 500) {
      return 'transient';
    }
  }
  // Network or unknown errors treated as transient
  return 'transient';
}

/**
 * Processes the offline post queue, sending each post to the server.
 */
async function processQueue() {
  if (isSyncing) {
    logger.info('Sync already in progress.', 'SyncManager');
    return;
  }

  if (!navigator.onLine) {
    logger.info('Cannot sync, currently offline.', 'SyncManager');
    return;
  }

  if (!currentUserId) {
    logger.info('No user bound to sync manager. Skipping processing.', 'SyncManager');
    return;
  }

  isSyncing = true;
  logger.info('Starting offline queue sync.', 'SyncManager');

  try {
    const queue = await offlineQueueService.getQueueByUser(currentUserId);
    if (queue.length === 0) {
      logger.info('Offline queue is empty.', 'SyncManager');
      return;
    }

    logger.info(`Processing ${queue.length} items from the offline queue.`, 'SyncManager');
    syncStart(queue.length);

    let processed = 0;
    for (const post of queue) {
      if (post.attempts >= MAX_SYNC_ATTEMPTS) {
        logger.warn(
          `Post ${post.id} has exceeded max sync attempts. Removing from queue.`,
          'SyncManager'
        );
        await offlineQueueService.removeFromQueue(post.id);
        processed += 1;
        syncProgress(processed, queue.length);
        continue;
      }

      try {
        const result = await timelineService.createEvent(post.payload);
        if (result.success) {
          logger.info(`Successfully synced post ${post.id}. Removing from queue.`, 'SyncManager');
          await offlineQueueService.removeFromQueue(post.id);
        } else {
          const err = new Error(result.error || 'Sync failed with no specific error');
          // Treat unknown result failures as transient
          const type = classifyError(err);
          if (type === 'permanent') {
            await offlineQueueService.removeFromQueue(post.id);
          } else {
            await offlineQueueService.incrementAttemptCount(post.id);
          }
        }
      } catch (err) {
        logger.error(`Failed to sync post ${post.id}.`, err, 'SyncManager');
        const type = classifyError(err);
        if (type === 'permanent') {
          await offlineQueueService.removeFromQueue(post.id);
        } else {
          await offlineQueueService.incrementAttemptCount(post.id);
        }
      }
      processed += 1;
      syncProgress(processed, queue.length);
    }

    logger.info('Offline queue sync finished.', 'SyncManager');
  } catch (err) {
    logger.error('An error occurred during queue processing.', err, 'SyncManager');
  } finally {
    isSyncing = false;
    queueUpdated();
    syncComplete();

    // If items remain, schedule a retry with exponential backoff based on max attempts
    if (navigator.onLine && currentUserId) {
      offlineQueueService
        .getQueueByUser(currentUserId)
        .then(remain => {
          if (remain.length > 0) {
            const maxAttempts = remain.reduce((m, p) => Math.max(m, p.attempts || 0), 0);
            const base = 2000 * Math.pow(2, Math.min(maxAttempts, 5));
            const jitter = Math.floor(Math.random() * 1000);
            const delay = Math.min(60000, base + jitter);
            if (scheduledRetry) {
              clearTimeout(scheduledRetry);
            }
            scheduledRetry = setTimeout(processQueue, delay);
            logger.info(`Scheduled next sync attempt in ${delay}ms.`, 'SyncManager');
          }
        })
        .catch(() => {
          /* noop */
        });
    }
  }
}

/**
 * Initializes the sync manager.
 * Listens for online events to trigger a queue sync.
 */
function init() {
  // Listen for the browser coming online
  window.addEventListener('online', processQueue);
  // When tab becomes visible again, try syncing
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      processQueue();
    }
  });

  // Attempt to process the queue on initial load, in case the app was
  // closed and reopened with an internet connection.
  setTimeout(processQueue, 5000); // Delay slightly to avoid impacting initial load performance

  logger.info('Sync Manager initialized.', 'SyncManager');
}

export const syncManager = {
  init,
  processQueue,
  setCurrentUser,
};
