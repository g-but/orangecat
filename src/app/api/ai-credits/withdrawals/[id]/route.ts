/**
 * AI Creator Withdrawal Management API
 *
 * GET /api/ai-credits/withdrawals/[id] - Get withdrawal details
 * DELETE /api/ai-credits/withdrawals/[id] - Cancel a pending withdrawal
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiBadRequest,
  apiForbidden,
  apiNotFound,
  handleApiError,
} from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import { validateUUID, getValidationError } from '@/lib/api/validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ai-credits/withdrawals/[id]
 * Get withdrawal details
 */
export const GET = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'withdrawal ID'));
  if (idValidation) {return idValidation;}
  const { user, supabase } = request;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  try {
    const { data: withdrawal, error } = await db
      .from(DATABASE_TABLES.AI_CREATOR_WITHDRAWALS)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // RLS also enforces this
      .single();

    if (error || !withdrawal) {
      return apiNotFound('Withdrawal');
    }

    return apiSuccess({ withdrawal });
  } catch (error) {
    logger.error('Failed to get withdrawal', { error });
    return handleApiError(error);
  }
});

/**
 * DELETE /api/ai-credits/withdrawals/[id]
 * Cancel a pending withdrawal
 */
export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'withdrawal ID'));
  if (idValidation) {return idValidation;}
  const { user, supabase } = request;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = retryAfterSeconds(rl);
      return handleApiError({ message: `Rate limit exceeded. Retry after ${retryAfter}s.` });
    }

    const { error } = await db.rpc('cancel_ai_withdrawal', {
      p_withdrawal_id: id,
      p_user_id: user.id,
    });

    if (error) {
      if (error.message.includes('not found')) {return apiNotFound('Withdrawal');}
      if (error.message.includes('Unauthorized')) {return apiForbidden('Unauthorized');}
      if (error.message.includes('Only pending')) {return apiBadRequest('Only pending withdrawals can be cancelled');}
      throw error;
    }

    logger.info('Withdrawal cancelled', { userId: user.id, withdrawalId: id });
    return apiSuccess({ message: 'Withdrawal cancelled successfully' });
  } catch (error) {
    logger.error('Failed to cancel withdrawal', { error });
    return handleApiError(error);
  }
});
