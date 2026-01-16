/**
 * Database Tables Constants
 *
 * SSOT for non-entity database table names.
 * For entity tables (projects, services, products, etc.), use getTableName() from entity-registry.ts
 *
 * Usage:
 *   import { DATABASE_TABLES } from '@/config/database-tables';
 *   supabase.from(DATABASE_TABLES.MESSAGES).select('*')
 */

export const DATABASE_TABLES = {
  // Messaging
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
  CONVERSATION_PARTICIPANTS: 'conversation_participants',
  PARTICIPANT_READ_TIMES: 'participant_read_times',

  // Social
  PROFILES: 'profiles',
  FOLLOWS: 'follows',
  USER_FOLLOWS: 'user_follows',
  ACTORS: 'actors',

  // User Stats & Presence
  USER_STATS: 'user_stats',
  USER_PRESENCE: 'user_presence',

  // Projects
  PROJECT_FAVORITES: 'project_favorites',
  PROJECT_UPDATES: 'project_updates',
  PROJECT_MEDIA: 'project_media',

  // Groups
  GROUP_MEMBERS: 'group_members',
  GROUP_WALLETS: 'group_wallets',
  GROUP_INVITATIONS: 'group_invitations',
  GROUP_EVENTS: 'group_events',
  GROUP_EVENT_RSVPS: 'group_event_rsvps',

  // Wallets & Transactions
  WALLETS: 'wallets',
  TRANSACTIONS: 'transactions',

  // Timeline
  TIMELINE_EVENTS: 'timeline_events',
  TIMELINE_EVENT_STATS: 'timeline_event_stats',
  TIMELINE_EVENT_VISIBILITY: 'timeline_event_visibility',
  TIMELINE_COMMENTS: 'timeline_comments',
  TIMELINE_LIKES: 'timeline_likes',
  TIMELINE_DISLIKES: 'timeline_dislikes',
  ENRICHED_TIMELINE_EVENTS: 'enriched_timeline_events',
  COMMUNITY_TIMELINE: 'community_timeline_no_duplicates',

  // System
  AUDIT_LOGS: 'audit_logs',
  CHANNEL_WAITLIST: 'channel_waitlist',
  DRAFT_EVENTS: 'draft_events',
  TYPING_INDICATORS: 'typing_indicators',
  TRANSPARENCY_SCORES: 'transparency_scores',

  // AI Assistants
  AI_CONVERSATIONS: 'ai_conversations',
  AI_MESSAGES: 'ai_messages',
  AI_ASSISTANT_RATINGS: 'ai_assistant_ratings',
  AI_USER_CREDITS: 'ai_user_credits',
  AI_CREDIT_TRANSACTIONS: 'ai_credit_transactions',

  // Bookings
  BOOKINGS: 'bookings',
  AVAILABILITY_SLOTS: 'availability_slots',
  ASSET_AVAILABILITY: 'asset_availability',

  // Entity Tables (for direct access when not using entity-registry)
  USER_ASSETS: 'user_assets',
  USER_PRODUCTS: 'user_products',
  USER_SERVICES: 'user_services',
  USER_PROJECTS: 'user_projects',
  USER_CAUSES: 'user_causes',
  USER_LOANS: 'user_loans',
  AI_ASSISTANTS: 'ai_assistants',
} as const;

// Timeline tables shorthand (for backward compatibility with timeline services)
export const TIMELINE_TABLES = {
  EVENTS: DATABASE_TABLES.TIMELINE_EVENTS,
  EVENT_STATS: DATABASE_TABLES.TIMELINE_EVENT_STATS,
  EVENT_VISIBILITY: DATABASE_TABLES.TIMELINE_EVENT_VISIBILITY,
  COMMENTS: DATABASE_TABLES.TIMELINE_COMMENTS,
  LIKES: DATABASE_TABLES.TIMELINE_LIKES,
  DISLIKES: DATABASE_TABLES.TIMELINE_DISLIKES,
  ENRICHED_EVENTS: DATABASE_TABLES.ENRICHED_TIMELINE_EVENTS,
  ENRICHED_VIEW: DATABASE_TABLES.ENRICHED_TIMELINE_EVENTS,
  COMMUNITY: DATABASE_TABLES.COMMUNITY_TIMELINE,
  COMMUNITY_VIEW: DATABASE_TABLES.COMMUNITY_TIMELINE,
} as const;

// Type for table names
export type DatabaseTableName = (typeof DATABASE_TABLES)[keyof typeof DATABASE_TABLES];
