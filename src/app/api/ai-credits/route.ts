/**
 * AI Credits API
 *
 * GET  /api/ai-credits - Get user's current credit balance and transaction history
 * POST /api/ai-credits - Request a deposit (generates payment details)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, handleApiError } from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { getPagination } from '@/lib/api/query';
import { DATABASE_TABLES } from '@/config/database-tables';
import { createCreditDeposit } from '@/domain/aiCredits/depositService';

const depositRequestSchema = z.object({
  amount_btc: z.number().positive().min(0.000001).max(10),
  payment_method: z.enum(['lightning', 'onchain']).default('lightning'),
});

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });

    const { data: credits, error: creditsError } = await supabase
      .from(DATABASE_TABLES.AI_USER_CREDITS).select('*').eq('user_id', user.id).single();

    if (creditsError && creditsError.code !== 'PGRST116') {throw creditsError;}

    const balance = credits
      ? { balance_btc: credits.balance_btc || 0, total_deposited_btc: credits.total_deposited_btc || 0, total_spent_btc: credits.total_spent_btc || 0 }
      : { balance_btc: 0, total_deposited_btc: 0, total_spent_btc: 0 };

    const { data: transactions, error: txError } = await supabase
      .from(DATABASE_TABLES.AI_CREDIT_TRANSACTIONS)
      .select('id, transaction_type, amount_btc, balance_before, balance_after, description, created_at, assistant:ai_assistants(id, name, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (txError) {logger.warn('Failed to fetch transactions', { error: txError });}

    const { count } = await supabase
      .from(DATABASE_TABLES.AI_CREDIT_TRANSACTIONS)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return apiSuccess({
      balance,
      transactions: transactions || [],
      pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
    });
  } catch (error) {
    logger.error('Failed to get AI credits', { error });
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = retryAfterSeconds(rl);
      return handleApiError({ message: `Rate limit exceeded. Retry after ${retryAfter}s.` });
    }

    const body = await (request as NextRequest).json();
    const result = depositRequestSchema.safeParse(body);
    if (!result.success) {return handleApiError({ message: 'Invalid request', details: result.error.flatten() });}

    const deposit = await createCreditDeposit(supabase, user.id, result.data.amount_btc, result.data.payment_method);
    return apiSuccess(deposit);
  } catch (error) {
    logger.error('Failed to create deposit request', { error });
    return handleApiError(error);
  }
});
