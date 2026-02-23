/**
 * AI Creator Withdrawals API
 *
 * GET /api/ai-credits/withdrawals - List creator's withdrawals
 * POST /api/ai-credits/withdrawals - Request a new withdrawal
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiValidationError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { DATABASE_TABLES } from '@/config/database-tables';

// Minimum withdrawal amount (1000 sats)
const MIN_WITHDRAWAL_SATS = 1000;

const withdrawalRequestSchema = z.object({
  amount_sats: z
    .number()
    .int()
    .positive()
    .min(MIN_WITHDRAWAL_SATS, `Minimum withdrawal is ${MIN_WITHDRAWAL_SATS} sats`),
  lightning_address: z
    .string()
    .min(1, 'Lightning address is required')
    .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid Lightning address format'),
});

/**
 * GET /api/ai-credits/withdrawals
 * List creator's withdrawal history
 */
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (request: NextRequest) => {
  try {
    const supabase = await createServerClient();
    const db = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get creator earnings summary
    const { data: earnings } = await db
      .from(DATABASE_TABLES.AI_CREATOR_EARNINGS)
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get withdrawals
    const {
      data: withdrawals,
      error: withdrawalsError,
      count,
    } = await db
      .from(DATABASE_TABLES.AI_CREATOR_WITHDRAWALS)
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (withdrawalsError) {
      throw withdrawalsError;
    }

    return apiSuccess({
      earnings: earnings || {
        total_earned_sats: 0,
        total_withdrawn_sats: 0,
        available_balance_sats: 0,
        pending_withdrawal_sats: 0,
      },
      withdrawals: withdrawals || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    logger.error('Failed to get withdrawals', { error });
    return handleApiError(error);
  }
});

/**
 * POST /api/ai-credits/withdrawals
 * Request a new withdrawal
 */
export const POST = compose(
  withRequestId(),
  withRateLimit('write')
)(async (request: NextRequest) => {
  try {
    const supabase = await createServerClient();
    const db = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const result = withdrawalRequestSchema.safeParse(body);

    if (!result.success) {
      return apiValidationError('Invalid request', result.error.flatten().fieldErrors);
    }

    const { amount_sats, lightning_address } = result.data;

    // Request withdrawal via RPC
    const { data: withdrawalId, error } = await db.rpc('request_ai_withdrawal', {
      p_user_id: user.id,
      p_amount_sats: amount_sats,
      p_lightning_address: lightning_address,
    });

    if (error) {
      if (error.message.includes('Insufficient balance')) {
        return apiError('Insufficient balance for withdrawal', 'BAD_REQUEST', 400);
      }
      throw error;
    }

    // Get the created withdrawal
    const { data: withdrawal } = await db
      .from(DATABASE_TABLES.AI_CREATOR_WITHDRAWALS)
      .select('*')
      .eq('id', String(withdrawalId))
      .single();

    logger.info('Withdrawal requested', {
      userId: user.id,
      withdrawalId,
      amount_sats,
    });

    return apiSuccess(
      {
        withdrawal,
        message: 'Withdrawal request submitted successfully. Processing will begin shortly.',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to request withdrawal', { error });
    return handleApiError(error);
  }
});
