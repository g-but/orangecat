/**
 * AI Creator Withdrawal Management API
 *
 * GET /api/ai-credits/withdrawals/[id] - Get withdrawal details
 * DELETE /api/ai-credits/withdrawals/[id] - Cancel a pending withdrawal
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiBadRequest,
  apiForbidden,
  apiUnauthorized,
  apiNotFound,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ai-credits/withdrawals/[id]
 * Get withdrawal details
 */
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (_request: NextRequest, context: RouteContext) => {
  try {
    const supabase = await createServerClient();
    const db = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    const { id } = await context.params;

    const { data: withdrawal, error } = await db
      .from('ai_creator_withdrawals')
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
export const DELETE = compose(
  withRequestId(),
  withRateLimit('write')
)(async (_request: NextRequest, context: RouteContext) => {
  try {
    const supabase = await createServerClient();
    const db = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    const { id } = await context.params;

    // Call cancel RPC
    const { error } = await db.rpc('cancel_ai_withdrawal', {
      p_withdrawal_id: id,
      p_user_id: user.id,
    });

    if (error) {
      if (error.message.includes('not found')) {
        return apiNotFound('Withdrawal');
      }
      if (error.message.includes('Unauthorized')) {
        return apiForbidden('Unauthorized');
      }
      if (error.message.includes('Only pending')) {
        return apiBadRequest('Only pending withdrawals can be cancelled');
      }
      throw error;
    }

    logger.info('Withdrawal cancelled', {
      userId: user.id,
      withdrawalId: id,
    });

    return apiSuccess({
      message: 'Withdrawal cancelled successfully',
    });
  } catch (error) {
    logger.error('Failed to cancel withdrawal', { error });
    return handleApiError(error);
  }
});
