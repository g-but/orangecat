/**
 * Conversation creation — self, direct, and group conversations.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { DATABASE_TABLES } from '@/config/database-tables';
import { clientFrom } from './db-helpers.server';
import { getServerUser, ensureMessagingFunctions } from './auth.server';
import type {
  ConversationsInsert,
  ConversationParticipantsInsert,
  ProfilesInsert,
} from './db-types.server';

export async function openConversation(
  participantIds: string[],
  title?: string | null
): Promise<string> {
  const { supabase, user } = await getServerUser();
  if (!user) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  await ensureMessagingFunctions();

  const admin = createAdminClient();
  const ensureProfile = async (id: string) => {
    const { data: existing, error: checkError } = await admin
      .from(DATABASE_TABLES.PROFILES)
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (!existing) {
      const profileData: ProfilesInsert = {
        id,
        username: `user_${id.slice(0, 8)}`,
        name: 'User',
      };
      const { error: insertError } = await clientFrom(admin, DATABASE_TABLES.PROFILES).insert(
        profileData
      );
      if (insertError) {
        throw insertError;
      }
    }
  };

  // Self conversation (Notes to Self)
  if (!participantIds || participantIds.length === 0) {
    await ensureProfile(user.id);
    const convData: ConversationsInsert = {
      created_by: user.id,
      is_group: false,
    };
    const { data: convIns, error: convErr } = await clientFrom(admin, DATABASE_TABLES.CONVERSATIONS)
      .insert(convData)
      .select('id')
      .single();
    if (convErr || !convIns || !convIns.id) {
      throw Object.assign(new Error('Failed to create conversation'), { status: 500 });
    }
    const convId = convIns.id as string;
    const participantData: ConversationParticipantsInsert = {
      conversation_id: convId,
      user_id: user.id,
      role: 'member',
      is_active: true,
    };
    const { error: partErr } = await clientFrom(
      admin,
      DATABASE_TABLES.CONVERSATION_PARTICIPANTS
    ).insert(participantData);
    if (partErr) {
      await clientFrom(admin, DATABASE_TABLES.CONVERSATIONS).delete().eq('id', convId);
      throw Object.assign(new Error('Failed to add participant'), { status: 500 });
    }
    return convId;
  }

  // Direct message with one other user
  if (participantIds.length === 1) {
    const otherId = participantIds[0];
    await ensureProfile(user.id);
    await ensureProfile(otherId);

    const convData: ConversationsInsert = {
      created_by: user.id,
      is_group: false,
    };
    const { data: convIns, error: convErr } = await clientFrom(admin, DATABASE_TABLES.CONVERSATIONS)
      .insert(convData)
      .select('id')
      .single();
    if (convErr || !convIns || !convIns.id) {
      throw Object.assign(new Error('Failed to create conversation'), { status: 500 });
    }
    const newId = convIns.id as string;
    const participantsData: ConversationParticipantsInsert[] = [
      { conversation_id: newId, user_id: user.id, role: 'member', is_active: true },
      { conversation_id: newId, user_id: otherId, role: 'member', is_active: true },
    ];
    const { error: pErr } = await clientFrom(
      admin,
      DATABASE_TABLES.CONVERSATION_PARTICIPANTS
    ).insert(participantsData);
    if (pErr) {
      throw Object.assign(new Error('Failed to add participants'), { status: 500 });
    }
    return newId;
  }

  // Group conversation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC function not in generated Database type
  const { data: groupId, error: groupErr } = await (supabase.rpc as any)(
    'create_group_conversation',
    {
      p_created_by: user.id,
      p_participant_ids: participantIds,
      p_title: title || null,
    }
  );
  if (!groupErr && groupId) {
    return groupId as unknown as string;
  }

  // Fallback: admin create
  await ensureProfile(user.id);
  for (const id of participantIds) {
    await ensureProfile(id);
  }
  const groupConvData: ConversationsInsert = {
    created_by: user.id,
    is_group: true,
    title: title || null,
  };
  const { data: convIns, error: cErr } = await clientFrom(admin, DATABASE_TABLES.CONVERSATIONS)
    .insert(groupConvData)
    .select('id')
    .single();
  if (cErr || !convIns || !convIns.id) {
    throw Object.assign(new Error('Failed to create conversation'), { status: 500 });
  }
  const gid = convIns.id as string;
  const rows: ConversationParticipantsInsert[] = [user.id, ...participantIds].map(pid => ({
    conversation_id: gid,
    user_id: pid,
    role: pid === user.id ? 'admin' : 'member',
    is_active: true,
  }));
  const { error: pErr } = await clientFrom(admin, DATABASE_TABLES.CONVERSATION_PARTICIPANTS).insert(
    rows
  );
  if (pErr) {
    throw Object.assign(new Error('Failed to add participants'), { status: 500 });
  }
  return gid;
}
