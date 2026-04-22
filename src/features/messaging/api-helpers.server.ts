/**
 * Messaging API Helpers
 *
 * Database operations shared by the conversation-messages route.
 * Extracted to keep the route thin (HTTP layer only).
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { DATABASE_TABLES } from '@/config/database-tables';
import type { Database } from '@/types/database';

type AdminClient = ReturnType<typeof createAdminClient>;

type ParticipantRow = {
  user_id: string;
  role: string;
  joined_at: string;
  last_read_at: string | null;
  is_active: boolean;
  profiles: { username: string | null; name: string | null; avatar_url: string | null } | null;
};

export interface ConversationContext {
  conversation: Record<string, unknown>;
  formattedParticipants: Array<{
    user_id: string;
    username: string;
    name: string;
    avatar_url: string;
    role: string;
    joined_at: string;
    last_read_at: string | null;
    is_active: boolean;
  }>;
  unreadCount: number;
}

/**
 * Fetch conversation + participants + unread count for the GET response.
 * Returns null if the conversation doesn't exist.
 */
export async function fetchConversationContext(
  admin: AdminClient,
  conversationId: string,
  userId: string
): Promise<ConversationContext | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [convResult, participantsResult] = await Promise.all([
    (admin.from(DATABASE_TABLES.CONVERSATIONS) as any).select('*').eq('id', conversationId).single(),
    admin
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .select('user_id, role, joined_at, last_read_at, is_active, profiles:user_id (id, username, name, avatar_url)')
      .eq('conversation_id', conversationId),
  ]);

  if (convResult.error || !convResult.data) return null;

  const formattedParticipants = ((participantsResult.data || []) as ParticipantRow[]).map(p => ({
    user_id: p.user_id,
    username: p.profiles?.username || '',
    name: p.profiles?.name || '',
    avatar_url: p.profiles?.avatar_url || '',
    role: p.role,
    joined_at: p.joined_at,
    last_read_at: p.last_read_at,
    is_active: p.is_active,
  }));

  const userParticipant = formattedParticipants.find(p => p.user_id === userId);
  let unreadCount = 0;
  if (userParticipant?.last_read_at) {
    const { count } = await admin
      .from(DATABASE_TABLES.MESSAGES)
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .gt('created_at', userParticipant.last_read_at)
      .eq('is_deleted', false);
    unreadCount = count || 0;
  }

  return { conversation: convResult.data as Record<string, unknown>, formattedParticipants, unreadCount };
}

/**
 * Verify the user is a participant and reactivate if soft-deleted.
 * Returns 'not_found' | 'ok'.
 */
export async function verifyParticipantAndReactivate(
  admin: AdminClient,
  conversationId: string,
  userId: string
): Promise<'not_found' | 'ok'> {
  const { data, error } = await admin
    .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
    .select('user_id, is_active')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return 'not_found';

  const participant = data as { is_active?: boolean };
  if (participant.is_active === false) {
    const updateData: Database['public']['Tables']['conversation_participants']['Update'] = {
      is_active: true,
      last_read_at: new Date().toISOString(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS) as any)
      .update(updateData)
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
  }

  return 'ok';
}
