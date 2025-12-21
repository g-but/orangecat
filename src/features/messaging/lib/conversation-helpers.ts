/**
 * Conversation Helper Functions
 *
 * Centralized helpers for conversation operations.
 * Eliminates duplication across API routes and services.
 *
 * @module messaging/lib/conversation-helpers
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { PARTICIPANT_ROLES } from './constants';
import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface ConversationCreateResult {
  conversationId: string;
  isExisting: boolean;
}

export interface ParticipantInfo {
  conversationId: string;
  userId: string;
  role: string;
  isActive: boolean;
}

// =============================================================================
// PARTICIPANT HELPERS
// =============================================================================

/**
 * Normalize participant IDs: deduplicate and always include the creator
 */
export function normalizeParticipants(
  participantIds: string[],
  creatorId: string
): string[] {
  const uniqueIds = new Set(participantIds.filter((id): id is string => typeof id === 'string'));
  uniqueIds.add(creatorId);
  return Array.from(uniqueIds);
}

/**
 * Get all conversation IDs where a user is an active participant
 */
export async function getUserConversationIds(
  admin: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error || !data) {
    return [];
  }

  return data.map((p) => p.conversation_id).filter(Boolean);
}

/**
 * Get all active participants for a conversation
 */
export async function getConversationParticipants(
  admin: SupabaseClient,
  conversationId: string
): Promise<ParticipantInfo[]> {
  const { data, error } = await admin
    .from('conversation_participants')
    .select('conversation_id, user_id, role, is_active')
    .eq('conversation_id', conversationId)
    .eq('is_active', true);

  if (error || !data) {
    return [];
  }

  return (data as any[]).map((p) => ({
    conversationId: p.conversation_id as string,
    userId: p.user_id as string,
    role: p.role as string,
    isActive: Boolean(p.is_active),
  }));
}

/**
 * Check if a user is an active participant in a conversation
 */
export async function isUserParticipant(
  admin: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<boolean> {
  const { data } = await admin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  return !!data;
}

// =============================================================================
// CONVERSATION FINDING
// =============================================================================

/**
 * Find an existing direct conversation between exactly two users
 */
export async function findExistingDirectConversation(
  admin: SupabaseClient,
  userId1: string,
  userId2: string
): Promise<string | null> {
  // Get all non-group conversations where user1 is a participant
  const userConversationIds = await getUserConversationIds(admin, userId1);

  if (userConversationIds.length === 0) {
    return null;
  }

  // Get non-group conversations
  const { data: conversations } = await admin
    .from('conversations')
    .select('id')
    .in('id', userConversationIds)
    .eq('is_group', false);

  if (!conversations || conversations.length === 0) {
    return null;
  }

  // Check each conversation for exactly these two participants
  for (const conv of conversations) {
    const participants = await getConversationParticipants(admin, conv.id);

    if (participants.length === 2) {
      const participantIds = participants.map((p) => p.userId);
      if (participantIds.includes(userId1) && participantIds.includes(userId2)) {
        return conv.id;
      }
    }
  }

  return null;
}

/**
 * Find an existing self-conversation (Notes to Self)
 */
export async function findExistingSelfConversation(
  admin: SupabaseClient,
  userId: string
): Promise<string | null> {
  const userConversationIds = await getUserConversationIds(admin, userId);

  if (userConversationIds.length === 0) {
    return null;
  }

  // Get non-group conversations
  const { data: conversations } = await admin
    .from('conversations')
    .select('id')
    .in('id', userConversationIds)
    .eq('is_group', false);

  if (!conversations || conversations.length === 0) {
    return null;
  }

  // Find one with exactly one participant (self)
  for (const conv of conversations) {
    const participants = await getConversationParticipants(admin, conv.id);

    if (participants.length === 1 && participants[0].userId === userId) {
      return conv.id;
    }
  }

  return null;
}

// =============================================================================
// CONVERSATION CREATION
// =============================================================================

/**
 * Create a new conversation with participants
 */
export async function createConversation(
  admin: SupabaseClient,
  creatorId: string,
  participantIds: string[],
  options: {
    isGroup: boolean;
    title?: string | null;
  }
): Promise<string> {
  // Create conversation
  const { data: newConv, error: convError } = await admin
    .from('conversations')
    .insert({
      created_by: creatorId,
      is_group: options.isGroup,
      title: options.title || null,
    })
    .select('id')
    .single();

  if (convError || !newConv) {
    throw new Error(`Failed to create conversation: ${convError?.message || 'Unknown error'}`);
  }

  const conversationId = newConv.id;

  // Add participants
  const participantRows = participantIds.map((userId) => ({
    conversation_id: conversationId,
    user_id: userId,
    role: userId === creatorId ? PARTICIPANT_ROLES.ADMIN : PARTICIPANT_ROLES.MEMBER,
    is_active: true,
  }));

  const { error: participantError } = await admin
    .from('conversation_participants')
    .insert(participantRows);

  if (participantError) {
    // Rollback: delete the conversation
    await admin.from('conversations').delete().eq('id', conversationId);
    throw new Error(`Failed to add participants: ${participantError.message}`);
  }

  return conversationId;
}

// =============================================================================
// UNIFIED OPEN/CREATE CONVERSATION
// =============================================================================

/**
 * Open or create a conversation based on participants.
 * - Self (0 or 1 participant = creator): Find or create self-conversation
 * - Direct (2 participants): Find existing or create new direct conversation
 * - Group (3+ participants): Always create new group conversation
 */
export async function openOrCreateConversation(
  creatorId: string,
  rawParticipantIds: string[],
  title?: string | null
): Promise<ConversationCreateResult> {
  const admin = createAdminClient();
  const allParticipants = normalizeParticipants(rawParticipantIds, creatorId);
  const count = allParticipants.length;

  // Self conversation (Notes to Self)
  if (count === 1) {
    const existingId = await findExistingSelfConversation(admin, creatorId);
    if (existingId) {
      return { conversationId: existingId, isExisting: true };
    }

    const newId = await createConversation(admin, creatorId, allParticipants, {
      isGroup: false,
    });
    return { conversationId: newId, isExisting: false };
  }

  // Direct conversation (2 participants)
  if (count === 2) {
    const otherId = allParticipants.find((id) => id !== creatorId)!;
    const existingId = await findExistingDirectConversation(admin, creatorId, otherId);
    if (existingId) {
      return { conversationId: existingId, isExisting: true };
    }

    const newId = await createConversation(admin, creatorId, allParticipants, {
      isGroup: false,
    });
    return { conversationId: newId, isExisting: false };
  }

  // Group conversation (3+ participants) - always create new
  const newId = await createConversation(admin, creatorId, allParticipants, {
    isGroup: true,
    title,
  });
  return { conversationId: newId, isExisting: false };
}
