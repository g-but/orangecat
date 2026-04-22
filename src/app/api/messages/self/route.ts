import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiInternalError, handleApiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

/** Insert a conversation row + participant row using the given Supabase client. */
async function insertConversationAndParticipant(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  userId: string
): Promise<string> {
  const { data: convIns, error: convErr } = await client
    .from(DATABASE_TABLES.CONVERSATIONS)
    .insert({ created_by: userId, is_group: false })
    .select('id')
    .single();
  if (convErr || !convIns?.id) throw convErr || new Error('conv insert failed');
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
    const { user } = _req;
    const supabase = await createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Find existing self-conversation (single-participant DM)
    let conversationId: string | null = null;
    const { data: convs } = await supabase
      .from(DATABASE_TABLES.CONVERSATION_DETAILS)
      .select('*')
      .order('created_at', { ascending: false });

    if (Array.isArray(convs)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selfConv = (convs as any[]).find(c => {
        if (c.is_group) return false;
        const parts = Array.isArray(c.participants) ? c.participants : [];
        return parts.length === 1 && parts[0]?.user_id === user.id;
      });
      if (selfConv) conversationId = selfConv.id;
    }

    if (!conversationId) {
      const { ProfileServerService } = await import('@/services/profile/server');
      const profileResult = await ProfileServerService.ensureProfile(supabase, user.id, user.email || '', user.user_metadata || {});
      if (profileResult.error || !profileResult.data) {
        logger.error('Failed to ensure user profile', { error: profileResult.error, userId: user.id }, 'Messages');
        return apiInternalError('Failed to create user profile');
      }

      try {
        conversationId = await insertConversationAndParticipant(db, user.id);
      } catch (serverError) {
        if (process.env.NODE_ENV !== 'production') {
          try {
            conversationId = await insertConversationAndParticipant(createAdminClient(), user.id);
          } catch (e) {
            logger.error('Self conversation creation failed (admin fallback)', { error: e, userId: user.id }, 'Messages');
            return apiInternalError('Self conversation creation failed');
          }
        } else {
          logger.error('Failed to create conversation', { error: serverError, userId: user.id }, 'Messages');
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
