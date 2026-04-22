/**
 * AI Creator Withdrawals API
 *
 * GET  /api/ai-credits/withdrawals - List creator's withdrawals
 * POST /api/ai-credits/withdrawals - Request a new withdrawal
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiError, apiValidationError, handleApiError } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

const MIN_WITHDRAWAL_SATS = 1000;

const withdrawalRequestSchema = z.object({
  amount_btc: z.number().int().positive().min(MIN_WITHDRAWAL_SATS, `Minimum withdrawal is ${MIN_WITHDRAWAL_SATS} sat`),
  lightning_address: z.string().min(1, 'Lightning address is required').regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid Lightning address format'),
});

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const [{ data: earnings }, { data: withdrawals, error: withdrawalsError, count }] = await Promise.all([
      db.from(DATABASE_TABLES.AI_CREATOR_EARNINGS).select('*').eq('user_id', user.id).single(),
      db.from(DATABASE_TABLES.AI_CREATOR_WITHDRAWALS).select('*', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).range(offset, offset + limit - 1),
    ]);

    if (withdrawalsError) {throw withdrawalsError;}

    return apiSuccess({
      earnings: earnings || { total_earned_btc: 0, total_withdrawn_btc: 0, available_balance_btc: 0, pending_withdrawal_btc: 0 },
      withdrawals: withdrawals || [],
      pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
    });
  } catch (error) {
    logger.error('Failed to get withdrawals', { error });
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return handleApiError({ message: `Rate limit exceeded. Retry after ${retryAfter}s.` });
    }

    const body = await (request as NextRequest).json();
    const result = withdrawalRequestSchema.safeParse(body);
    if (!result.success) {return apiValidationError('Invalid request', result.error.flatten().fieldErrors);}

    const { amount_btc, lightning_address } = result.data;

    const { data: withdrawalId, error } = await db.rpc('request_ai_withdrawal', {
      p_user_id: user.id, p_amount_btc: amount_btc, p_lightning_address: lightning_address,
    });

    if (error) {
      if (error.message.includes('Insufficient balance')) {return apiError('Insufficient balance for withdrawal', 'BAD_REQUEST', 400);}
      throw error;
    }

    const { data: withdrawal } = await db.from(DATABASE_TABLES.AI_CREATOR_WITHDRAWALS).select('*').eq('id', String(withdrawalId)).single();
    logger.info('Withdrawal requested', { userId: user.id, withdrawalId, amount_btc });
    return apiSuccess({ withdrawal, message: 'Withdrawal request submitted successfully. Processing will begin shortly.' }, { status: 201 });
  } catch (error) {
    logger.error('Failed to request withdrawal', { error });
    return handleApiError(error);
  }
});
