import { DATABASE_TABLES } from '@/config/database-tables';
import type { ActionHandler } from './types';

export const communicationHandlers: Record<string, ActionHandler> = {
  post_to_timeline: async (supabase, _userId, actorId, params) => {
    // timeline_events schema: event_type, event_subtype, subject_type (all required),
    // title (required), description (text), content (jsonb { text: ... })
    // No entity_id column — not timeline_posts (which doesn't exist).
    const text = (params.content as string) || '';
    const title = text.length > 100 ? text.slice(0, 97) + '…' : text;

    const { data, error } = await supabase
      .from(DATABASE_TABLES.TIMELINE_EVENTS)
      .insert({
        actor_id: actorId,
        event_type: 'post',
        event_subtype: 'text',
        subject_type: 'profile',
        title,
        description: text,
        content: { text },
        visibility: (params.visibility as string) || 'public',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const snippet = text.length > 60 ? text.slice(0, 57) + '…' : text;
    return { success: true, data: { ...data, displayMessage: `📢 Posted to timeline: "${snippet}"` } };
  },

  send_message: async (supabase, userId, _actorId, params) => {
    // Resolve recipient: accept "@username" (preferred) or raw UUID (fallback)
    let recipientId = params.recipient_id as string | undefined;
    const recipientParam = (params.recipient as string | undefined) ?? recipientId;

    if (!recipientParam) {
      return { success: false, error: 'recipient is required' };
    }

    if (recipientParam.startsWith('@') || !recipientParam.match(/^[0-9a-f-]{36}$/i)) {
      // Looks like a username — resolve to user ID via profiles table
      const username = recipientParam.replace(/^@/, '');
      const { data: profile, error: profileError } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('id')
        .eq('username', username)
        .single();

      if (profileError || !profile) {
        return { success: false, error: `User @${username} not found` };
      }
      recipientId = profile.id as string;
    } else {
      recipientId = recipientParam;
    }

    // Find existing direct conversation via conversation_participants junction table
    // (conversations has no participant_1_id/participant_2_id columns — uses junction table)
    const { data: myParticipations } = await supabase
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .select('conversation_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    const myConvIds = (myParticipations || []).map(
      (r: { conversation_id: string }) => r.conversation_id
    );

    let conversationId: string | null = null;

    if (myConvIds.length > 0) {
      const { data: shared } = await supabase
        .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
        .select('conversation_id')
        .eq('user_id', recipientId)
        .eq('is_active', true)
        .in('conversation_id', myConvIds)
        .limit(1)
        .maybeSingle();

      conversationId = (shared as { conversation_id: string } | null)?.conversation_id ?? null;
    }

    if (!conversationId) {
      // Create new direct conversation + both participant rows
      const { data: newConv, error: convError } = await supabase
        .from(DATABASE_TABLES.CONVERSATIONS)
        .insert({ created_by: userId, is_group: false })
        .select('id')
        .single();

      if (convError || !newConv) {
        return { success: false, error: convError?.message ?? 'Failed to create conversation' };
      }
      conversationId = (newConv as { id: string }).id;

      const { error: partError } = await supabase
        .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
        .insert([
          { conversation_id: conversationId, user_id: userId, role: 'member', is_active: true },
          { conversation_id: conversationId, user_id: recipientId, role: 'member', is_active: true },
        ])
        .select();

      if (partError) {
        return { success: false, error: `Could not set up conversation: ${partError.message}` };
      }
    }

    // Send message
    const { data, error } = await supabase
      .from(DATABASE_TABLES.MESSAGES)
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: params.content,
        message_type: 'text',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const recipientDisplay = recipientParam?.startsWith('@')
      ? recipientParam
      : `@${recipientParam}`;
    return {
      success: true,
      data: {
        ...data,
        conversation_id: conversationId,
        displayMessage: `💬 Message sent to ${recipientDisplay}`,
      },
    };
  },

  reply_to_message: async (supabase, userId, _actorId, params) => {
    const { data, error } = await supabase
      .from(DATABASE_TABLES.MESSAGES)
      .insert({
        conversation_id: params.conversation_id,
        sender_id: userId,
        content: params.content,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: { ...data, displayMessage: '💬 Reply sent' } };
  },
};
