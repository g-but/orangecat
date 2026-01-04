// src/lib/message-queue.ts
// Message-specific offline queue service

import {
  addToQueueStore,
  getQueueStore,
  removeFromQueueStore,
  incrementAttemptCount,
  clearQueueStore,
  getQueueByUser,
  registerQueueStore,
  type QueuedItem,
} from './offline-queue-base';
import { messageQueueUpdated } from './message-queue-events';

const STORE_NAME = 'offlineMessageQueue';

export interface QueuedMessagePayload {
  conversationId: string;
  content: string;
  messageType?: string;
  metadata?: any;
  tempId?: string; // Track optimistic message ID
}

export type QueuedMessage = QueuedItem<QueuedMessagePayload>;

// Register the message queue store
registerQueueStore(STORE_NAME, () => {
  messageQueueUpdated();
});

/**
 * Adds a message to the offline queue.
 */
export async function addMessageToQueue(
  payload: QueuedMessagePayload,
  userId: string
): Promise<string> {
  return addToQueueStore<QueuedMessagePayload>(STORE_NAME, payload, userId);
}

/**
 * Retrieves all messages from the offline queue, sorted by creation time.
 */
export async function getMessageQueue(): Promise<QueuedMessage[]> {
  return getQueueStore<QueuedMessagePayload>(STORE_NAME);
}

/**
 * Removes a message from the queue by its ID.
 */
export async function removeMessageFromQueue(id: string): Promise<void> {
  return removeFromQueueStore(STORE_NAME, id);
}

/**
 * Updates the attempt count for a queued message.
 */
export async function incrementMessageAttemptCount(id: string): Promise<void> {
  return incrementAttemptCount(STORE_NAME, id);
}

/**
 * Clears the entire message queue.
 */
export async function clearMessageQueue(): Promise<void> {
  return clearQueueStore(STORE_NAME);
}

/**
 * Retrieves all messages for a specific user.
 */
export async function getMessageQueueByUser(userId: string): Promise<QueuedMessage[]> {
  return getQueueByUser<QueuedMessagePayload>(STORE_NAME, userId);
}

export const messageQueueService = {
  addMessageToQueue,
  getMessageQueue,
  getMessageQueueByUser,
  removeMessageFromQueue,
  incrementMessageAttemptCount,
  clearMessageQueue,
};



