import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  apiSuccess,
  apiForbidden,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import type { Database } from '@/types/database';
import { DATABASE_TABLES } from '@/config/database-tables';

export const POST = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) => {
  try {
    const { conversationId } = await params;
    const { user } = req;

    // Use admin client to bypass RLS for both verification and update
    const admin = createAdminClient();

    // Verify user is a participant
    const { data: participant, error: partError } = await admin
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (partError || !participant) {
      return apiForbidden('Not a participant in this conversation');
    }

    // Mark conversation as read by updating last_read_at
    // Use admin client to bypass RLS
    const updateData: Database['public']['Tables']['conversation_participants']['Update'] = {
      last_read_at: new Date().toISOString(),
    };
    const updateQuery = admin
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .update(updateData as any)
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true);
    const { error: readError } = await (updateQuery as any);

    if (readError) {
      logger.error('Error marking conversation as read', { error: readError, conversationId, userId: user.id }, 'Messages');
      return handleApiError(readError);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    logger.error('Mark read API error', { error, conversationId: (await params).conversationId, userId: req.user.id }, 'Messages');
    return handleApiError(error);
  }
});
