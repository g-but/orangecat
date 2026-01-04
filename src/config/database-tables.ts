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

  // Other
  CHANNEL_WAITLIST: 'channel_waitlist',
  TIMELINE_EVENTS: 'timeline_events',
  TIMELINE_EVENT_STATS: 'timeline_event_stats',
} as const;

// Type for table names
export type DatabaseTableName = typeof DATABASE_TABLES[keyof typeof DATABASE_TABLES];
