/**
 * Message fetch operations — retrieve messages with pagination and read receipts.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { Message, Pagination } from './types';
import { DATABASE_TABLES } from '@/config/database-tables';
import { STATUS } from '@/config/database-constants';
import { getServerUser } from './auth.server';

export async function fetchMessages(
  conversationId: string,
  userId?: string,
  cursor?: string,
  limit = 50
): Promise<{ messages: Message[]; pagination: Pagination }> {
  const { user } = await getServerUser();
  if (!user) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const admin = createAdminClient();

  // Verify membership
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

  let query = admin
    .from(DATABASE_TABLES.MESSAGES)
    .select(
      `
      id,
      conversation_id,
      sender_id,
      content,
      message_type,
      metadata,
      created_at,
      updated_at,
      is_deleted,
      edited_at,
      profiles:sender_id (id, username, name, avatar_url)
    `,
      { count: 'exact' }
    )
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, count, error } = await query;
  if (error) {
    throw Object.assign(new Error('Failed to fetch messages'), { status: 500 });
  }

  // Get all participants' last_read_at for read receipt calculation
  const { data: allParticipants } = await admin
    .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
    .select('user_id, last_read_at')
    .eq('conversation_id', conversationId)
    .eq('is_active', true);

  interface ParticipantReadTime {
    user_id: string;
    last_read_at: string | null;
  }
  const participantReadTimes = new Map<string, Date | null>();
  allParticipants?.forEach((p: ParticipantReadTime) => {
    participantReadTimes.set(p.user_id, p.last_read_at ? new Date(p.last_read_at) : null);
  });

  const userLastReadAt = participantReadTimes.get(user.id) || null;

  interface MessageRow {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    message_type: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    edited_at: string | null;
    profiles?: {
      id?: string;
      username?: string;
      name?: string;
      avatar_url?: string | null;
    };
  }

  const messages = (data || []).map((m: MessageRow) => {
    const messageCreatedAt = new Date(m.created_at);

    let isRead = false;
    let isDelivered = false;
    let status: 'pending' | 'failed' | 'sent' | 'delivered' | 'read' = STATUS.MESSAGES.SENT;

    if (m.sender_id === user.id) {
      isDelivered = true;
      status = STATUS.MESSAGES.DELIVERED;

      let recipientHasRead = false;
      for (const [participantId, lastReadAt] of participantReadTimes.entries()) {
        if (participantId !== user.id && lastReadAt) {
          if (messageCreatedAt <= lastReadAt) {
            recipientHasRead = true;
            break;
          }
        }
      }

      isRead = recipientHasRead;
      if (isRead) {
        status = STATUS.MESSAGES.READ;
      }
    } else {
      isDelivered = true;
      isRead = userLastReadAt ? messageCreatedAt <= userLastReadAt : false;
      status = isRead ? STATUS.MESSAGES.READ : STATUS.MESSAGES.DELIVERED;
    }

    return {
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      message_type: m.message_type,
      metadata: m.metadata,
      created_at: m.created_at,
      updated_at: m.updated_at,
      is_deleted: m.is_deleted,
      edited_at: m.edited_at,
      sender: {
        id: m.profiles?.id || m.sender_id,
        username: m.profiles?.username || '',
        name: m.profiles?.name || '',
        avatar_url: m.profiles?.avatar_url || null,
      },
      is_read: isRead,
      is_delivered: isDelivered,
      status: status,
    };
  });

  const hasMore = messages.length > limit;
  const slice = hasMore ? messages.slice(0, limit) : messages;
  const sorted = slice.reverse() as Message[];
  const nextCursor = hasMore && sorted.length > 0 ? sorted[0].created_at : null;
  return { messages: sorted, pagination: { hasMore, nextCursor, count: count || sorted.length } };
}
