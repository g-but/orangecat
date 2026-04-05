/**
 * Message send and mark-read operations.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/utils/logger';
import type { Json } from '@/types/database';
import { DATABASE_TABLES } from '@/config/database-tables';
import { clientFrom } from './db-helpers.server';
import { getServerUser } from './auth.server';
import { NotificationDispatcher } from '@/services/notifications/dispatcher';
import type {
  MessagesInsert,
  ConversationsUpdate,
  ConversationParticipantsUpdate,
} from './db-types.server';

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  type: string = 'text',
  metadata: Record<string, unknown> | null = null,
  senderActorId?: string | null
): Promise<string> {
  const { user } = await getServerUser();
  if (!user) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  if (user.id !== senderId) {
    throw Object.assign(new Error('Sender ID does not match authenticated user'), { status: 403 });
  }

  try {
    const admin = createAdminClient();

    // If senderActorId provided, verify user has permission to send as that actor
    if (senderActorId) {
      const { data: actor, error: actorError } = await clientFrom(admin, DATABASE_TABLES.ACTORS)
        .select('id, actor_type, user_id, group_id')
        .eq('id', senderActorId)
        .single();

      if (actorError || !actor) {
        throw Object.assign(new Error('Invalid sender actor'), { status: 400 });
      }

      if (actor.actor_type === 'user' && actor.user_id !== user.id) {
        throw Object.assign(new Error('Cannot send as this actor'), { status: 403 });
      }

      if (actor.actor_type === 'group' && actor.group_id) {
        const { data: membership, error: memberError } = await clientFrom(
          admin,
          DATABASE_TABLES.GROUP_MEMBERS
        )
          .select('role')
          .eq('group_id', actor.group_id)
          .eq('user_id', user.id)
          .in('role', ['founder', 'admin', 'moderator'])
          .maybeSingle();

        if (memberError || !membership) {
          throw Object.assign(new Error('Not authorized to send as this group'), { status: 403 });
        }
      }
    }

    // Verify sender is a participant
    const { data: participant, error: partError } = await admin
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (partError || !participant) {
      throw Object.assign(new Error('User is not a participant in this conversation'), {
        status: 403,
      });
    }

    const messageData: MessagesInsert = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: content,
      message_type: type,
      metadata: (metadata || {}) as Json,
    };

    if (senderActorId) {
      (messageData as MessagesInsert & { sender_actor_id?: string }).sender_actor_id =
        senderActorId;
    }

    const { data: message, error: insertError } = await clientFrom(admin, DATABASE_TABLES.MESSAGES)
      .insert(messageData)
      .select('id')
      .single();

    if (insertError || !message) {
      logger.error('Error inserting message:', insertError);
      throw Object.assign(new Error('Failed to send message'), { status: 500 });
    }

    // Update conversation metadata
    const conversationUpdate: ConversationsUpdate = {
      last_message_at: new Date().toISOString(),
      last_message_preview: content.substring(0, 100),
      last_message_sender_id: senderId,
      updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await clientFrom(admin, DATABASE_TABLES.CONVERSATIONS)
      .update(conversationUpdate)
      .eq('id', conversationId);

    if (updateError) {
      logger.warn('Failed to update conversation metadata:', updateError);
    }

    // Update sender's last_read_at
    const participantUpdate: ConversationParticipantsUpdate = {
      last_read_at: new Date().toISOString(),
    };
    const { error: readError } = await clientFrom(admin, DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .update(participantUpdate)
      .eq('conversation_id', conversationId)
      .eq('user_id', senderId);

    if (readError) {
      logger.warn('Failed to update sender read time:', readError);
    }

    // Notify other participants (fire-and-forget)
    try {
      const { data: otherParticipants } = await admin
        .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
        .select('user_id')
        .eq('conversation_id', conversationId)
        .eq('is_active', true)
        .neq('user_id', senderId);

      if (otherParticipants && otherParticipants.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: senderProfile } = await (admin.from(DATABASE_TABLES.PROFILES) as any)
          .select('name, username')
          .eq('id', senderId)
          .maybeSingle();
        const senderName: string =
          senderProfile?.name || senderProfile?.username || 'Someone';
        const preview = content.length > 100 ? `${content.substring(0, 100)}...` : content;

        for (const recipient of otherParticipants as Array<{ user_id: string }>) {
          void NotificationDispatcher.dispatch({
            userId: recipient.user_id,
            type: 'message',
            title: `New message from ${senderName}`,
            message: preview,
            sourceEntityType: 'conversation',
            sourceEntityId: conversationId,
            actionUrl: `/messages?id=${conversationId}`,
          });
        }
      }
    } catch (notifError) {
      logger.warn('Failed to dispatch message notifications', { error: notifError });
    }

    logger.info('Message sent successfully:', message.id);
    return message.id;
  } catch (error) {
    logger.error('Error sending message:', error);
    throw error;
  }
}

export async function markConversationRead(conversationId: string) {
  const { user } = await getServerUser();
  if (!user) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const admin = createAdminClient();
  const participantUpdate: ConversationParticipantsUpdate = {
    last_read_at: new Date().toISOString(),
  };
  await clientFrom(admin, DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
    .update(participantUpdate)
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);
}
