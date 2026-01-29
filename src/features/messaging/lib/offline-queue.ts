/**
 * Offline Queue Helper
 *
 * Centralized helper for queuing messages when offline.
 * Eliminates duplicated queue logic in MessageComposer.
 *
 * @module messaging/lib/offline-queue
 */

import { messageQueueService } from '@/lib/message-queue';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface QueuedMessageData {
  conversationId: string;
  content: string;
  messageType: string;
  tempId: string;
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Queue a message for later sending when offline
 *
 * @returns true if successfully queued, false otherwise
 */
export async function queueMessageForLater(
  data: QueuedMessageData,
  userId: string,
  options: {
    showToast?: boolean;
    toastMessage?: string;
  } = {}
): Promise<boolean> {
  const {
    showToast = true,
    toastMessage = "You're offline. Message saved and will send when connected.",
  } = options;

  try {
    await messageQueueService.addMessageToQueue(
      {
        conversationId: data.conversationId,
        content: data.content,
        messageType: data.messageType,
        tempId: data.tempId,
      },
      userId
    );

    if (showToast) {
      toast.info(toastMessage);
    }

    return true;
  } catch (error) {
    logger.error('Failed to queue message', error, 'Messaging');
    if (showToast) {
      toast.error('Failed to save message offline. Please try again.');
    }
    return false;
  }
}

/**
 * Attempt to queue a message if offline or on network error
 *
 * @returns true if queued (meaning caller should stop processing), false if online
 */
export async function queueIfOffline(data: QueuedMessageData, userId: string): Promise<boolean> {
  if (!isOnline()) {
    return queueMessageForLater(data, userId);
  }
  return false;
}

/**
 * Handle a network error by attempting to queue the message
 *
 * @param error The caught error
 * @returns true if successfully queued
 */
export async function handleNetworkError(
  error: unknown,
  data: QueuedMessageData,
  userId: string
): Promise<boolean> {
  // Check if this looks like a network error
  const isNetworkError =
    !isOnline() ||
    (error instanceof Error && error.name === 'TypeError') ||
    (error instanceof Error && error.message.includes('network')) ||
    (error instanceof Error && error.message.includes('fetch'));

  if (isNetworkError) {
    return queueMessageForLater(data, userId, {
      toastMessage: 'Network error. Message saved and will send when connected.',
    });
  }

  return false;
}
