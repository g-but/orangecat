/**
 * Database Constants - Single Source of Truth
 *
 * All status enums, types, and database constants.
 * Prevents magic strings throughout codebase.
 *
 * Benefits:
 * - Safe refactoring (rename status in one place)
 * - Autocomplete support
 * - Prevents typos
 * - Type safety
 * - Easy to find all usages
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial database constants registry
 */

/**
 * Status values for all entities
 * 
 * Usage:
 * ```typescript
 * import { STATUS } from '@/config/database-constants';
 * 
 * // ✅ GOOD - Type-safe, autocomplete works
 * if (project.status === STATUS.PROJECTS.ACTIVE) { ... }
 * 
 * // ❌ BAD - Hardcoded, no type safety
 * if (project.status === 'active') { ... }
 * ```
 */
export const STATUS = {
  PROJECTS: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
  PROPOSALS: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PASSED: 'passed',
    FAILED: 'failed',
    EXECUTED: 'executed',
    CANCELLED: 'cancelled',
  },
  LOANS: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    DEFAULTED: 'defaulted',
  },
  LOAN_OFFERS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
  },
  TRANSACTIONS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },
  PRODUCTS: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    SOLD_OUT: 'sold_out',
  },
  SERVICES: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    UNAVAILABLE: 'unavailable',
  },
  CAUSES: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    PAUSED: 'paused',
  },
  MESSAGES: {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
  },
  GROUP_MEMBERS: {
    FOUNDER: 'founder',
    ADMIN: 'admin',
    MEMBER: 'member',
  },
  GROUP_EVENTS: {
    GENERAL: 'general',
    MEETING: 'meeting',
    CELEBRATION: 'celebration',
    ASSEMBLY: 'assembly',
  },
  GROUP_EVENT_RSVPS: {
    GOING: 'going',
    MAYBE: 'maybe',
    NOT_GOING: 'not_going',
  },
  GROUP_INVITATIONS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    EXPIRED: 'expired',
    REVOKED: 'revoked',
  },
  CONTRACTS: {
    DRAFT: 'draft',
    PROPOSED: 'proposed',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    TERMINATED: 'terminated',
    CANCELLED: 'cancelled',
  },
  AI_ASSISTANTS: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    ARCHIVED: 'archived',
  },
  EVENTS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    OPEN: 'open',
    FULL: 'full',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
} as const;

/**
 * Type helpers for status values
 */
export type ProjectStatus = typeof STATUS.PROJECTS[keyof typeof STATUS.PROJECTS];
export type ProposalStatus = typeof STATUS.PROPOSALS[keyof typeof STATUS.PROPOSALS];
export type LoanStatus = typeof STATUS.LOANS[keyof typeof STATUS.LOANS];
export type LoanOfferStatus = typeof STATUS.LOAN_OFFERS[keyof typeof STATUS.LOAN_OFFERS];
export type TransactionStatus = typeof STATUS.TRANSACTIONS[keyof typeof STATUS.TRANSACTIONS];
export type ProductStatus = typeof STATUS.PRODUCTS[keyof typeof STATUS.PRODUCTS];
export type ServiceStatus = typeof STATUS.SERVICES[keyof typeof STATUS.SERVICES];
export type CauseStatus = typeof STATUS.CAUSES[keyof typeof STATUS.CAUSES];
export type MessageStatus = typeof STATUS.MESSAGES[keyof typeof STATUS.MESSAGES];
export type GroupMemberRole = typeof STATUS.GROUP_MEMBERS[keyof typeof STATUS.GROUP_MEMBERS];
export type GroupEventType = typeof STATUS.GROUP_EVENTS[keyof typeof STATUS.GROUP_EVENTS];
export type GroupEventRsvpStatus = typeof STATUS.GROUP_EVENT_RSVPS[keyof typeof STATUS.GROUP_EVENT_RSVPS];
export type GroupInvitationStatus = typeof STATUS.GROUP_INVITATIONS[keyof typeof STATUS.GROUP_INVITATIONS];
export type ContractStatus = typeof STATUS.CONTRACTS[keyof typeof STATUS.CONTRACTS];
export type AiAssistantStatus = typeof STATUS.AI_ASSISTANTS[keyof typeof STATUS.AI_ASSISTANTS];
export type EventStatus = typeof STATUS.EVENTS[keyof typeof STATUS.EVENTS];

/**
 * Currency constants
 */
export const CURRENCY = {
  SATS: 'SATS',
  BTC: 'BTC',
  USD: 'USD',
} as const;

export type Currency = typeof CURRENCY[keyof typeof CURRENCY];

/**
 * Actor types
 */
export const ACTOR_TYPES = {
  USER: 'user',
  GROUP: 'group',
} as const;

export type ActorType = typeof ACTOR_TYPES[keyof typeof ACTOR_TYPES];

/**
 * Proposal types
 */
export const PROPOSAL_TYPES = {
  GENERAL: 'general',
  TREASURY: 'treasury',
  MEMBERSHIP: 'membership',
  GOVERNANCE: 'governance',
  EMPLOYMENT: 'employment',
} as const;

export type ProposalType = typeof PROPOSAL_TYPES[keyof typeof PROPOSAL_TYPES];

/**
 * Contract types
 */
export const CONTRACT_TYPES = {
  EMPLOYMENT: 'employment',
  SERVICE: 'service',
  RENTAL: 'rental',
  PARTNERSHIP: 'partnership',
  MEMBERSHIP: 'membership',
} as const;

export type ContractType = typeof CONTRACT_TYPES[keyof typeof CONTRACT_TYPES];

/**
 * Message types
 */
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

/**
 * Conversation types
 */
export const CONVERSATION_TYPES = {
  DIRECT: 'direct',
  GROUP: 'group',
} as const;

export type ConversationType = typeof CONVERSATION_TYPES[keyof typeof CONVERSATION_TYPES];

/**
 * Visibility levels
 */
export const VISIBILITY = {
  PUBLIC: 'public',
  MEMBERS_ONLY: 'members_only',
  PRIVATE: 'private',
} as const;

export type Visibility = typeof VISIBILITY[keyof typeof VISIBILITY];

/**
 * Vote values
 */
export const VOTES = {
  YES: 'yes',
  NO: 'no',
  ABSTAIN: 'abstain',
} as const;

export type Vote = typeof VOTES[keyof typeof VOTES];

/**
 * Support types for projects
 */
export const SUPPORT_TYPES = {
  BITCOIN_DONATION: 'bitcoin_donation',
  SIGNATURE: 'signature',
  MESSAGE: 'message',
  REACTION: 'reaction',
} as const;

export type SupportType = typeof SUPPORT_TYPES[keyof typeof SUPPORT_TYPES];

/**
 * Helper function to check if a status is valid
 */
export function isValidStatus<T extends keyof typeof STATUS>(
  entity: T,
  status: string
): status is typeof STATUS[T][keyof typeof STATUS[T]] {
  return Object.values(STATUS[entity]).includes(status as any);
}
