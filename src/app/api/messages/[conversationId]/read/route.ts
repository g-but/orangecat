import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  apiSuccess,
  apiForbidden,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import type { Database } from '@/types/database';
import { DATABASE_TABLES } from '@/config/database-tables';
import { validateUUID, getValidationError } from '@/lib/api/validation';

export const POST = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) => {
  const { conversationId } = await params;
  const idValidation = getValidationError(validateUUID(conversationId, 'conversation ID'));
  if (idValidation) {return idValidation;}
  try {
    const { user } = req;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    // Use admin client to bypass RLS for both verification and update
    const admin = createAdminClient();

    // Verify user is a participant
    const { data: participant, error: partError } = await (admin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS) as any)
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
    const { error: readError } = await (admin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS) as any)
      .update(updateData)
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true);

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
