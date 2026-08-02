import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiInternalError, handleApiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import type { AnySupabaseClient } from '@/lib/supabase/types';

/** Insert a conversation row + participant row using the given Supabase client. */
async function insertConversationAndParticipant(
  client: AnySupabaseClient,
  userId: string
): Promise<string> {
  const { data: convIns, error: convErr } = await client
    .from(DATABASE_TABLES.CONVERSATIONS)
    .insert({ created_by: userId, is_group: false })
    .select('id')
    .single();
  if (convErr || !convIns?.id) {
    throw convErr || new Error('conv insert failed');
  }
  const conversationId = convIns.id as string;
  const { error: partErr } = await client
    .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
    .insert({ conversation_id: conversationId, user_id: userId, role: 'member' });
  if (partErr) {
    await createAdminClient().from(DATABASE_TABLES.CONVERSATIONS).delete().eq('id', conversationId);
    throw partErr;
  }
  return conversationId;
}

export const GET = withAuth(async (_req: AuthenticatedRequest) => {
  try {
    const { user, supabase } = _req;

    // Find existing self-conversation (single-participant DM), filtered in the
    // database instead of scanning the user's entire conversation list: the sole
    // participant (index 0) is the caller and there is no second participant.
    const { data: selfConv } = await supabase
      .from(DATABASE_TABLES.CONVERSATION_DETAILS)
      .select('id')
      .eq('is_group', false)
      .eq('participants->0->>user_id', user.id)
      .is('participants->1', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let conversationId: string | null = (selfConv as { id: string } | null)?.id ?? null;

    if (!conversationId) {
      const { ProfileServerService } = await import('@/services/profile/server');
      const profileResult = await ProfileServerService.ensureProfile(
        supabase,
        user.id,
        user.email || '',
        user.user_metadata || {}
      );
      if (profileResult.error || !profileResult.data) {
        logger.error(
          'Failed to ensure user profile',
          { error: profileResult.error, userId: user.id },
          'Messages'
        );
        return apiInternalError('Failed to create user profile');
      }

      try {
        conversationId = await insertConversationAndParticipant(supabase, user.id);
      } catch (serverError) {
        if (process.env.NODE_ENV !== 'production') {
          try {
            conversationId = await insertConversationAndParticipant(createAdminClient(), user.id);
          } catch (e) {
            logger.error(
              'Self conversation creation failed (admin fallback)',
              { error: e, userId: user.id },
              'Messages'
            );
            return apiInternalError('Self conversation creation failed');
          }
        } else {
          logger.error(
            'Failed to create conversation',
            { error: serverError, userId: user.id },
            'Messages'
          );
          return apiInternalError('Failed to create conversation');
        }
      }
    }

    return apiSuccess({ conversationId });
  } catch (error) {
    logger.error('Self conversation GET error', { error, userId: _req.user.id }, 'Messages');
    return handleApiError(error);
  }
});
