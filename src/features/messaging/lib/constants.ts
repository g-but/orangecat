/**
 * Messaging System Constants
 *
 * Centralized configuration for the messaging system.
 * Single source of truth for all magic numbers and configuration values.
 *
 * @module messaging/lib/constants
 */

// =============================================================================
// PAGINATION
// =============================================================================

export const PAGINATION = {
  /** Default number of conversations to fetch */
  CONVERSATIONS_DEFAULT: 30,
  /** Maximum conversations per request */
  CONVERSATIONS_MAX: 100,
  /** Default number of messages to fetch */
  MESSAGES_DEFAULT: 50,
  /** Maximum messages per request */
  MESSAGES_MAX: 100,
} as const;

// =============================================================================
// VALIDATION
// =============================================================================

export const VALIDATION = {
  /** Maximum message content length */
  MESSAGE_MAX_LENGTH: 5000,
  /** Minimum message content length */
  MESSAGE_MIN_LENGTH: 1,
  /** Maximum participants in a conversation */
  MAX_PARTICIPANTS: 50,
  /** Maximum conversation title length */
  TITLE_MAX_LENGTH: 100,
} as const;

// =============================================================================
// TIMING
// =============================================================================

export const TIMING = {
  /** Debounce delay for mark-as-read (ms) */
  MARK_READ_DEBOUNCE_MS: 500,
  /** Minimum interval between conversation list refreshes (ms) */
  REFRESH_DEBOUNCE_MS: 400,
  /** Delay before recalculating read receipts after action (ms) */
  READ_RECEIPT_RECALC_DELAY_MS: 300,
  /** Long press duration to enter selection mode (ms) */
  LONG_PRESS_MS: 350,
  /** Auto-scroll delay after new message (ms) */
  AUTO_SCROLL_DELAY_MS: 100,
  /** Heartbeat interval for connection monitoring (ms) */
  HEARTBEAT_INTERVAL_MS: 30000,
  /** Initial reconnection delay (ms) */
  RECONNECT_INITIAL_DELAY_MS: 1000,
  /** Maximum reconnection delay (ms) */
  RECONNECT_MAX_DELAY_MS: 30000,
  /** Maximum reconnection attempts */
  RECONNECT_MAX_ATTEMPTS: 10,
} as const;

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

// =============================================================================
// MESSAGE STATUS
// =============================================================================

export const MESSAGE_STATUS = {
  PENDING: 'pending',
  FAILED: 'failed',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;

export type MessageStatus = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];

// =============================================================================
// PARTICIPANT ROLES
// =============================================================================

export const PARTICIPANT_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export type ParticipantRole = (typeof PARTICIPANT_ROLES)[keyof typeof PARTICIPANT_ROLES];

// =============================================================================
// ERROR CODES
// =============================================================================

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// =============================================================================
// API ROUTES
// =============================================================================

export const API_ROUTES = {
  CONVERSATIONS: '/api/messages',
  CONVERSATION: (id: string) => `/api/messages/${id}`,
  CONVERSATION_READ: (id: string) => `/api/messages/${id}/read`,
  CONVERSATION_SUMMARY: (id: string) => `/api/messages/${id}/summary`,
  OPEN_CONVERSATION: '/api/messages/open',
  SELF_CONVERSATION: '/api/messages/self',
  BULK_CONVERSATIONS: '/api/messages/bulk-conversations',
  BULK_DELETE: '/api/messages/bulk-delete',
  UNREAD_COUNT: '/api/messages/unread-count',
} as const;

// =============================================================================
// REALTIME CHANNELS
// =============================================================================

export const CHANNELS = {
  CONVERSATIONS_LIST: 'conversations-list',
  MESSAGES: (conversationId: string) => `messages:${conversationId}`,
} as const;

// =============================================================================
// DEBUG
// =============================================================================

/** Set to true to enable debug logging in development */
export const DEBUG = process.env.NODE_ENV === 'development';

/** Conditional logger that only logs in development */
export const debugLog = DEBUG
  ? (...args: unknown[]) => console.log('[Messaging]', ...args)
  : () => {};
