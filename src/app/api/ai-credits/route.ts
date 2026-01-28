/**
 * AI Credits API
 *
 * GET  /api/ai-credits - Get user's current credit balance and transaction history
 * POST /api/ai-credits - Request a deposit (generates payment details)
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiUnauthorized, handleApiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { getPagination } from '@/lib/api/query';

// Schema for deposit request
const depositRequestSchema = z.object({
  amount_sats: z.number().int().positive().min(100).max(1000000000),
  payment_method: z.enum(['lightning', 'onchain']).default('lightning'),
});

/**
 * GET /api/ai-credits
 * Returns user's credit balance and recent transactions
 */
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (request: NextRequest) => {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });

    // Get user's credit balance
    const { data: credits, error: creditsError } = await supabase
      .from('ai_user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no credits record exists, create one
    let balance = {
      balance_sats: 0,
      total_deposited_sats: 0,
      total_spent_sats: 0,
    };

    if (creditsError && creditsError.code === 'PGRST116') {
      // No record found - user has 0 credits
      balance = {
        balance_sats: 0,
        total_deposited_sats: 0,
        total_spent_sats: 0,
      };
    } else if (creditsError) {
      throw creditsError;
    } else if (credits) {
      balance = {
        balance_sats: credits.balance_sats || 0,
        total_deposited_sats: credits.total_deposited_sats || 0,
        total_spent_sats: credits.total_spent_sats || 0,
      };
    }

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('ai_credit_transactions')
      .select(
        `
        id,
        transaction_type,
        amount_sats,
        balance_before,
        balance_after,
        description,
        created_at,
        assistant:ai_assistants(id, name, avatar_url)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (transactionsError) {
      logger.warn('Failed to fetch transactions', { error: transactionsError });
    }

    // Get total transaction count
    const { count } = await supabase
      .from('ai_credit_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return apiSuccess({
      balance,
      transactions: transactions || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    logger.error('Failed to get AI credits', { error });
    return handleApiError(error);
  }
});

/**
 * POST /api/ai-credits
 * Request a deposit - generates payment details
 */
export const POST = compose(
  withRequestId(),
  withRateLimit('write')
)(async (request: NextRequest) => {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const result = depositRequestSchema.safeParse(body);

    if (!result.success) {
      return handleApiError({
        message: 'Invalid request',
        details: result.error.flatten(),
      });
    }

    const { amount_sats, payment_method } = result.data;

    // Generate a deposit request ID
    const depositId = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // For MVP, we'll create a pending deposit record
    // In production, this would integrate with a Lightning provider (BTCPay, Strike, etc.)
    const { data: deposit, error: depositError } = await supabase
      .from('ai_credit_deposits')
      .insert({
        id: depositId,
        user_id: user.id,
        amount_sats,
        payment_method,
        status: 'pending',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      })
      .select()
      .single();

    // If table doesn't exist, return mock payment details for development
    if (depositError && depositError.code === '42P01') {
      logger.info('ai_credit_deposits table does not exist, returning mock data');

      // Generate mock payment details
      const mockInvoice =
        payment_method === 'lightning'
          ? `lnbc${amount_sats}u1p${Math.random().toString(36).substr(2, 50)}`
          : null;

      return apiSuccess({
        deposit_id: depositId,
        amount_sats,
        payment_method,
        status: 'pending',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        payment_details: {
          invoice: mockInvoice,
          // In production: real invoice from Lightning provider
        },
        message: 'Development mode: Use manual credits for testing',
      });
    }

    if (depositError) {
      throw depositError;
    }

    // Generate Lightning invoice or Bitcoin address
    // TODO: Integrate with actual Lightning provider (BTCPay, Strike, Alby, etc.)
    const paymentDetails =
      payment_method === 'lightning'
        ? {
            invoice: `lnbc${amount_sats}u1p${Math.random().toString(36).substr(2, 50)}`,
            // In production, this would be a real BOLT11 invoice
          }
        : {
            address: 'bc1q_deposit_address_would_go_here',
            // In production, this would be a real Bitcoin address
          };

    return apiSuccess({
      deposit_id: deposit?.id || depositId,
      amount_sats,
      payment_method,
      status: 'pending',
      expires_at: deposit?.expires_at || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      payment_details: paymentDetails,
    });
  } catch (error) {
    logger.error('Failed to create deposit request', { error });
    return handleApiError(error);
  }
});
