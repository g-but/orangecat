// src/lib/sync-manager.ts

import { logger } from '@/utils/logger';
import { offlineQueueService } from './offline-queue';
import { timelineService } from '@/services/timeline';
import { dispatchQueueUpdatedEvent } from '@/hooks/useOfflineQueue';

const MAX_SYNC_ATTEMPTS = 5;
let isSyncing = false;

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

  isSyncing = true;
  logger.info('Starting offline queue sync.', 'SyncManager');

  try {
    const queue = await offlineQueueService.getQueue();
    if (queue.length === 0) {
      logger.info('Offline queue is empty.', 'SyncManager');
      return;
    }

    logger.info(`Processing ${queue.length} items from the offline queue.`, 'SyncManager');

    for (const post of queue) {
      if (post.attempts >= MAX_SYNC_ATTEMPTS) {
        logger.warn(
          `Post ${post.id} has exceeded max sync attempts. Removing from queue.`,
          'SyncManager'
        );
        await offlineQueueService.removeFromQueue(post.id);
        continue;
      }

      try {
        const result = await timelineService.createEvent(post.payload);
        if (result.success) {
          logger.info(`Successfully synced post ${post.id}. Removing from queue.`, 'SyncManager');
          await offlineQueueService.removeFromQueue(post.id);
        } else {
          throw new Error(result.error || 'Sync failed with no specific error');
        }
      } catch (err) {
        logger.error(`Failed to sync post ${post.id}.`, err, 'SyncManager');
        await offlineQueueService.incrementAttemptCount(post.id);
      }
    }

    logger.info('Offline queue sync finished.', 'SyncManager');
  } catch (err) {
    logger.error('An error occurred during queue processing.', err, 'SyncManager');
  } finally {
    isSyncing = false;
    dispatchQueueUpdatedEvent();
  }
}

/**
 * Initializes the sync manager.
 * Listens for online events to trigger a queue sync.
 */
function init() {
  // Listen for the browser coming online
  window.addEventListener('online', processQueue);

  // Attempt to process the queue on initial load, in case the app was
  // closed and reopened with an internet connection.
  setTimeout(processQueue, 5000); // Delay slightly to avoid impacting initial load performance

  logger.info('Sync Manager initialized.', 'SyncManager');
}

export const syncManager = {
  init,
  processQueue,
};
