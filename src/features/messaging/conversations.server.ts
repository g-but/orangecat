/**
 * Conversation fetch operations — list and summary.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/utils/logger';
import type { Conversation, Participant } from './types';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getServerUser } from './auth.server';
import type { ConversationsRow, ConversationParticipantsRow, ProfilesRow } from './db-types.server';

export async function fetchUserConversations(
  userId: string,
  limit: number = 30
): Promise<Conversation[]> {
  try {
    logger.info('fetchUserConversations: Starting, limit=', limit);
    let user;
    try {
      const { user: u } = await getServerUser();
      user = u;
    } catch (authError) {
      logger.error('fetchUserConversations: Auth error:', authError);
      return [];
    }

    if (!user) {
      logger.error('fetchUserConversations: No user found');
      return [];
    }
    logger.info('fetchUserConversations: User found', user.id);

    let admin;
    try {
      admin = createAdminClient();
      logger.info('fetchUserConversations: Admin client created');
    } catch (adminError) {
      logger.error('fetchUserConversations: Error creating admin client:', adminError);
      return [];
    }

    logger.info('Using manual conversation fetching method (RPC disabled)');

    const { data: participations, error: partError } = await admin
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .select('conversation_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(100);

    if (partError) {
      logger.error('Error fetching participations:', partError);
      return [];
    }

    if (!participations || participations.length === 0) {
      return [];
    }

    const conversationIds = (participations as ConversationParticipantsRow[])
      .map(p => p.conversation_id)
      .filter(Boolean);

    if (conversationIds.length === 0) {
      return [];
    }

    const { data: conversations, error: convError } = await admin
      .from(DATABASE_TABLES.CONVERSATIONS)
      .select(
        'id, title, is_group, created_at, updated_at, last_message_at, last_message_preview, last_message_sender_id, created_by'
      )
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (convError) {
      logger.error('Error fetching conversations:', convError);
      return [];
    }

    if (!conversations || conversations.length === 0) {
      return [];
    }

    const { data: allParticipants, error: participantsError } = await admin
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .select('conversation_id, user_id, role, joined_at, last_read_at, is_active')
      .in('conversation_id', conversationIds);

    if (participantsError) {
      logger.error('Error fetching participants:', participantsError);
      return (conversations as ConversationsRow[]).map(c => ({
        ...c,
        participants: [],
        unread_count: 0,
      })) as Conversation[];
    }

    const userIds = [
      ...new Set(
        (allParticipants || []).map((p: ConversationParticipantsRow) => p.user_id).filter(Boolean)
      ),
    ];
    let profilesMap = new Map<string, ProfilesRow>();
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from(DATABASE_TABLES.PROFILES)
        .select('id, username, name, avatar_url')
        .in('id', userIds);
      profilesMap = new Map((profiles || []).map((p: ProfilesRow) => [p.id, p]));
    }

    const participantsByConv = new Map<string, Participant[]>();
    for (const p of (allParticipants || []) as ConversationParticipantsRow[]) {
      if (!p || !p.conversation_id) {
        continue;
      }
      const profile = profilesMap.get(p.user_id);
      const list = participantsByConv.get(p.conversation_id) || [];
      list.push({
        user_id: p.user_id,
        username: profile?.username || '',
        name: profile?.name || '',
        avatar_url: profile?.avatar_url || null,
        role: p.role,
        joined_at: p.joined_at,
        last_read_at: p.last_read_at || '',
        is_active: p.is_active,
      });
      participantsByConv.set(p.conversation_id, list);
    }

    return (conversations as ConversationsRow[]).map(c => ({
      ...c,
      participants: participantsByConv.get(c.id) || [],
      unread_count: 0,
      last_message_preview: c.last_message_preview || null,
      last_message_sender_id: c.last_message_sender_id || null,
      last_message_at: c.last_message_at || null,
    })) as Conversation[];
  } catch (error) {
    logger.error('Error in fetchUserConversations:', error);
    return [];
  }
}

export async function fetchConversationSummary(conversationId: string): Promise<Conversation> {
  const { user } = await getServerUser();
  if (!user) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const admin = createAdminClient();

  const { data: participant } = await admin
    .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  if (!participant) {
    throw Object.assign(new Error('Access denied'), { status: 403 });
  }

  const { data: conv } = await admin
    .from(DATABASE_TABLES.CONVERSATIONS)
    .select('*')
    .eq('id', conversationId)
    .single();
  if (!conv) {
    throw Object.assign(new Error('Conversation not found'), { status: 404 });
  }

  const { data: participants } = await admin
    .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
    .select(
      `
      user_id,
      role,
      joined_at,
      last_read_at,
      is_active,
      profiles:user_id (
        id,
        username,
        name,
        avatar_url
      )
    `
    )
    .eq('conversation_id', conversationId);

  interface ParticipantWithProfile {
    user_id: string;
    role: string;
    joined_at: string;
    last_read_at: string | null;
    is_active: boolean;
    profiles?: {
      username?: string;
      name?: string;
      avatar_url?: string | null;
    };
  }

  const formattedParticipants = (participants || []).map((p: ParticipantWithProfile) => ({
    user_id: p.user_id,
    username: p.profiles?.username || '',
    name: p.profiles?.name || '',
    avatar_url: p.profiles?.avatar_url || null,
    role: p.role,
    joined_at: p.joined_at,
    last_read_at: p.last_read_at,
    is_active: p.is_active,
  }));

  return {
    ...(conv as ConversationsRow),
    participants: formattedParticipants,
    unread_count: 0,
  } as Conversation;
}
