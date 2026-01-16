/**
 * Message Utilities Module
 *
 * Shared utilities for message status calculation, formatting, and validation.
 * Single source of truth for all message-related logic to eliminate code duplication.
 *
 * @module messaging/lib/message-utils
 */

import type { Message, Participant } from '../types';
import { MESSAGE_STATUS, type MessageStatus } from './constants';

// =============================================================================
// MESSAGE STATUS CALCULATION
// =============================================================================

interface _ParticipantReadTime {
  userId: string;
  lastReadAt: Date | null;
}

/**
 * Calculate the delivery/read status of a message
 *
 * Status progression (like Facebook Messenger):
 * 1. pending - Message is being sent (optimistic)
 * 2. sent - Message reached server (in database)
 * 3. delivered - Message was delivered to recipient's device
 * 4. read - Recipient opened the conversation and saw the message
 *
 * Note: We don't track "delivered" separately from "sent" currently.
 * Once a message is in the database, we consider it "delivered" to the recipient.
 *
 * @param message - The message to calculate status for
 * @param currentUserId - The current user's ID
 * @param participantReadTimes - Map of participant IDs to their last_read_at times
 * @returns The calculated message status
 */
export function calculateMessageStatus(
  message: Message,
  currentUserId: string | undefined,
  participantReadTimes: Map<string, Date | null>
): MessageStatus {
  if (!currentUserId) {
    return MESSAGE_STATUS.SENT;
  }

  // Optimistic/pending messages (not yet confirmed by server)
  if (message.id.startsWith('temp-')) {
    return MESSAGE_STATUS.PENDING;
  }

  // Explicitly failed messages
  if (message.status === MESSAGE_STATUS.FAILED) {
    return MESSAGE_STATUS.FAILED;
  }

  const messageCreatedAt = new Date(message.created_at);

  // For messages FROM the current user - check if any recipient has read
  if (message.sender_id === currentUserId) {
    // Check if any recipient (other than sender) has read this message
    for (const [participantId, lastReadAt] of participantReadTimes.entries()) {
      if (participantId !== currentUserId && lastReadAt) {
        if (messageCreatedAt <= lastReadAt) {
          return MESSAGE_STATUS.READ;
        }
      }
    }
    // If in database but not read by anyone, it's at least delivered
    return MESSAGE_STATUS.DELIVERED;
  }

  // For messages TO the current user - check if current user has read
  const userLastReadAt = participantReadTimes.get(currentUserId);
  if (userLastReadAt && messageCreatedAt <= userLastReadAt) {
    return MESSAGE_STATUS.READ;
  }

  return MESSAGE_STATUS.DELIVERED;
}

/**
 * Apply read status to an array of messages
 *
 * @param messages - Array of messages to process
 * @param currentUserId - The current user's ID
 * @param participantReadTimes - Map of participant IDs to their last_read_at times
 * @returns Messages with status fields populated
 */
export function applyStatusToMessages(
  messages: Message[],
  currentUserId: string | undefined,
  participantReadTimes: Map<string, Date | null>
): Message[] {
  return messages.map(msg => {
    const status = calculateMessageStatus(msg, currentUserId, participantReadTimes);
    return {
      ...msg,
      status,
      is_read: status === MESSAGE_STATUS.READ,
      is_delivered:
        status === MESSAGE_STATUS.DELIVERED ||
        status === MESSAGE_STATUS.READ ||
        status === MESSAGE_STATUS.SENT,
    };
  });
}

/**
 * Build a participant read times map from participant array
 *
 * @param participants - Array of participants
 * @returns Map of user ID to last read time
 */
export function buildParticipantReadTimesMap(
  participants: Participant[]
): Map<string, Date | null> {
  const map = new Map<string, Date | null>();
  for (const p of participants) {
    map.set(p.user_id, p.last_read_at ? new Date(p.last_read_at) : null);
  }
  return map;
}

// =============================================================================
// MESSAGE FORMATTING
// =============================================================================

/**
 * Format a message timestamp for display (like Messenger)
 *
 * - Today: "2:30 PM"
 * - Yesterday: "Yesterday 2:30 PM"
 * - This week: "Tuesday 2:30 PM"
 * - This year: "Nov 15 at 2:30 PM"
 * - Older: "Nov 15, 2023"
 */
export function formatMessageTime(dateStr: string, options: { short?: boolean } = {}): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (options.short) {
    // For compact display in message list
    if (diffDays === 0) {
      return timeStr;
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Full display
  if (diffDays === 0) {
    return timeStr;
  }
  if (diffDays === 1) {
    return `Yesterday ${timeStr}`;
  }
  if (diffDays < 7) {
    return `${date.toLocaleDateString('en-US', { weekday: 'long' })} ${timeStr}`;
  }
  if (date.getFullYear() === now.getFullYear()) {
    return (
      date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }) + ` at ${timeStr}`
    );
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format relative time (like "5m", "2h", "3d")
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);

  if (minutes < 1) {
    return 'now';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${hours}h`;
  }
  if (days < 7) {
    return `${days}d`;
  }
  if (weeks < 4) {
    return `${weeks}w`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get date divider text for message grouping
 */
export function getDateDividerText(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Check if a date divider should be shown between two messages
 */
export function shouldShowDateDivider(currentMsg: Message, prevMsg: Message | null): boolean {
  if (!prevMsg) {
    return true;
  }
  const currentDate = new Date(currentMsg.created_at).toDateString();
  const prevDate = new Date(prevMsg.created_at).toDateString();
  return currentDate !== prevDate;
}

// =============================================================================
// CONVERSATION HELPERS
// =============================================================================

/**
 * Get display name for a conversation
 * - Group: Use title or list participant names
 * - Direct: Show other participant's name
 * - Self: "Notes to Self"
 */
export function getConversationDisplayName(
  title: string | null,
  isGroup: boolean,
  participants: Participant[],
  currentUserId: string | undefined
): string {
  if (title) {
    return title;
  }

  const otherParticipants = participants.filter(p => p.is_active && p.user_id !== currentUserId);

  if (otherParticipants.length === 0) {
    return 'Notes to Self';
  }

  if (otherParticipants.length === 1) {
    return otherParticipants[0].name || otherParticipants[0].username || 'Unknown User';
  }

  // Group without title - list first few names
  const names = otherParticipants
    .slice(0, 3)
    .map(p => p.name || p.username || 'Unknown')
    .filter(Boolean)
    .join(', ');

  if (otherParticipants.length > 3) {
    return `${names} +${otherParticipants.length - 3}`;
  }

  return names;
}

/**
 * Get the primary participant for a direct message (the other person)
 */
export function getPrimaryParticipant(
  participants: Participant[],
  currentUserId: string | undefined
): Participant | undefined {
  return participants.find(p => p.is_active && p.user_id !== currentUserId);
}

/**
 * Build a profile link for a participant
 */
export function getParticipantProfileHref(participant: Participant | undefined): string | null {
  if (!participant) {
    return null;
  }
  if (participant.username?.trim()) {
    return `/profiles/${encodeURIComponent(participant.username.trim())}`;
  }
  if (participant.user_id?.trim()) {
    return `/profiles/${encodeURIComponent(participant.user_id.trim())}`;
  }
  return null;
}

// =============================================================================
// MESSAGE VALIDATION
// =============================================================================

import { VALIDATION } from './constants';

/**
 * Validate message content
 */
export function validateMessageContent(content: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = content.trim();

  if (trimmed.length < VALIDATION.MESSAGE_MIN_LENGTH) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > VALIDATION.MESSAGE_MAX_LENGTH) {
    return {
      valid: false,
      error: `Message must be under ${VALIDATION.MESSAGE_MAX_LENGTH} characters`,
    };
  }

  return { valid: true };
}

/**
 * Truncate message preview (like conversation list)
 */
export function truncateMessagePreview(content: string, maxLength = 50): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.slice(0, maxLength - 3) + '...';
}

// =============================================================================
// OPTIMISTIC MESSAGE HELPERS
// =============================================================================

/**
 * Create an optimistic message for immediate UI feedback
 */
export function createOptimisticMessage(
  conversationId: string,
  senderId: string,
  content: string,
  sender: { id: string; username: string; name: string; avatar_url: string | null }
): Message {
  const tempId = `temp-${Date.now()}`;
  const now = new Date().toISOString();

  return {
    id: tempId,
    conversation_id: conversationId,
    sender_id: senderId,
    content: content.trim(),
    message_type: 'text',
    metadata: null,
    created_at: now,
    updated_at: now,
    is_deleted: false,
    edited_at: null,
    sender,
    is_read: false,
    is_delivered: false,
    status: MESSAGE_STATUS.PENDING,
  };
}

/**
 * Check if a message is optimistic (not yet confirmed)
 */
export function isOptimisticMessage(message: Message): boolean {
  return message.id.startsWith('temp-');
}

/**
 * Merge optimistic messages with confirmed messages
 * Removes duplicates and maintains sort order
 */
export function mergeMessages(existingMessages: Message[], newMessages: Message[]): Message[] {
  const existingIds = new Set(existingMessages.map(m => m.id));
  const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
  const merged = [...existingMessages, ...uniqueNew];

  // Sort by created_at chronologically
  return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

/**
 * Replace an optimistic message with the confirmed version
 */
export function confirmOptimisticMessage(
  messages: Message[],
  tempId: string,
  confirmedMessage: Message
): Message[] {
  const withoutOptimistic = messages.filter(m => m.id !== tempId);
  if (withoutOptimistic.find(m => m.id === confirmedMessage.id)) {
    return withoutOptimistic;
  }
  return mergeMessages(withoutOptimistic, [confirmedMessage]);
}
