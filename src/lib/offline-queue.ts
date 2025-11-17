// src/lib/offline-queue.ts

import { logger } from '@/utils/logger';
import { queueUpdated } from '@/lib/offline-queue-events';

const DB_NAME = 'OrangeCatDB';
const DB_VERSION = 1;
const STORE_NAME = 'offlinePostQueue';

interface QueuedPost {
  id: string;
  payload: any;
  createdAt: number;
  attempts: number;
  userId: string;
}

let db: IDBDatabase | null = null;

/**
 * Opens and initializes the IndexedDB database.
 */
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error('Failed to open IndexedDB', request.error, 'OfflineQueue');
      reject('Failed to open IndexedDB');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = event => {
      const tempDb = (event.target as IDBOpenDBRequest).result;
      if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
        tempDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Adds a post to the offline queue.
 * @param payload - The data required to make the post API call.
 */
export async function addToQueue(payload: any, userId: string): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const post: QueuedPost = {
    id: `queued-${Date.now()}-${Math.random()}`,
    payload,
    createdAt: Date.now(),
    attempts: 0,
    userId,
  };

  return new Promise((resolve, reject) => {
    const request = store.add(post);
    request.onsuccess = () => {
      logger.info('Post added to offline queue', post.id, 'OfflineQueue');
      queueUpdated();
      resolve();
    };
    request.onerror = () => {
      logger.error('Failed to add post to queue', request.error, 'OfflineQueue');
      reject(request.error);
    };
  });
}

/**
 * Retrieves all posts from the offline queue, sorted by creation time.
 */
export async function getQueue(): Promise<QueuedPost[]> {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      // Sort by oldest first to process in order
      const sorted = request.result.sort((a, b) => a.createdAt - b.createdAt);
      resolve(sorted);
    };
    request.onerror = () => {
      logger.error('Failed to get queue', request.error, 'OfflineQueue');
      reject(request.error);
    };
  });
}

/**
 * Removes a post from the queue by its ID.
 * @param id - The ID of the post to remove.
 */
export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => {
      logger.info('Post removed from offline queue', id, 'OfflineQueue');
      queueUpdated();
      resolve();
    };
    request.onerror = () => {
      logger.error('Failed to remove post from queue', request.error, 'OfflineQueue');
      reject(request.error);
    };
  });
}

/**
 * Updates the attempt count for a queued post.
 * @param id - The ID of the post to update.
 */
export async function incrementAttemptCount(id: string): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.get(id);

  request.onsuccess = () => {
    const post = request.result;
    if (post) {
      post.attempts += 1;
      store.put(post);
      queueUpdated();
    }
  };
}

/**
 * Clears the entire offline post queue.
 */
export async function clearQueue(): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.clear();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      logger.info('Offline queue cleared', 'OfflineQueue');
      queueUpdated();
      resolve();
    };
    request.onerror = () => {
      logger.error('Failed to clear queue', request.error, 'OfflineQueue');
      reject(request.error);
    };
  });
}

/**
 * Retrieves all posts for a specific user.
 */
export async function getQueueByUser(userId: string): Promise<QueuedPost[]> {
  const all = await getQueue();
  return all.filter(item => item.userId === userId);
}

export const offlineQueueService = {
  addToQueue,
  getQueue,
  getQueueByUser,
  removeFromQueue,
  incrementAttemptCount,
  clearQueue,
};
