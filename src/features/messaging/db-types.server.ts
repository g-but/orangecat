/**
 * Shared database types for messaging modules.
 *
 * Extracted from the monolithic service.server.ts so that
 * conversations, messages, and auth modules can all import
 * the same derived row/insert/update types without circular deps.
 */
import type { Database } from '@/types/database';

export type MessagesInsert = Database['public']['Tables']['messages']['Insert'];
export type ConversationsInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationsUpdate = Database['public']['Tables']['conversations']['Update'];
export type ConversationParticipantsInsert =
  Database['public']['Tables']['conversation_participants']['Insert'];
export type ConversationParticipantsUpdate =
  Database['public']['Tables']['conversation_participants']['Update'];
export type ConversationParticipantsRow =
  Database['public']['Tables']['conversation_participants']['Row'];
export type ConversationsRow = Database['public']['Tables']['conversations']['Row'];
export type ProfilesRow = Database['public']['Tables']['profiles']['Row'];
export type ProfilesInsert = Database['public']['Tables']['profiles']['Insert'];
