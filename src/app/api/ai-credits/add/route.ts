/**
 * AI Credits - Manual Add
 *
 * POST /api/ai-credits/add - Manually add credits (for testing/admin)
 *
 * In production, this would be restricted to admins or triggered by payment webhooks.
 * For MVP/development, we allow users to add credits to themselves.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiUnauthorized, handleApiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';

// Schema for adding credits
const addCreditsSchema = z.object({
  amount_sats: z.number().int().positive().min(1).max(1000000), // Max 1M sats for safety
  description: z.string().max(200).optional(),
});

/**
 * POST /api/ai-credits/add
 * Add credits to user's balance
 *
 * For MVP: Users can add credits to themselves (no real payment)
 * For production: This should only be called by payment webhooks or admins
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
    const result = addCreditsSchema.safeParse(body);

    if (!result.success) {
      return handleApiError({
        message: 'Invalid request',
        details: result.error.flatten(),
      });
    }

    const { amount_sats, description } = result.data;

    // Call the add_ai_credits RPC function
    const { data: newBalance, error: addError } = await supabase.rpc('add_ai_credits', {
      p_user_id: user.id,
      p_amount_sats: amount_sats,
      p_transaction_type: 'deposit',
      p_description: description || `Manual deposit of ${amount_sats} sats`,
    });

    if (addError) {
      // If the RPC doesn't exist, try a direct insert approach
      if (addError.code === '42883') {
        logger.warn('add_ai_credits RPC not found, using direct insert');

        // Upsert the credits record
        const { data: existingCredits } = await supabase
          .from('ai_user_credits')
          .select('balance_sats')
          .eq('user_id', user.id)
          .single();

        const currentBalance = existingCredits?.balance_sats || 0;
        const newBalanceValue = currentBalance + amount_sats;

        const { error: upsertError } = await supabase.from('ai_user_credits').upsert(
          {
            user_id: user.id,
            balance_sats: newBalanceValue,
            total_deposited_sats: amount_sats,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

        if (upsertError) {
          throw upsertError;
        }

        // Log the transaction
        await supabase.from('ai_credit_transactions').insert({
          user_id: user.id,
          transaction_type: 'deposit',
          amount_sats,
          balance_before: currentBalance,
          balance_after: newBalanceValue,
          description: description || `Manual deposit of ${amount_sats} sats`,
        });

        return apiSuccess({
          balance_sats: newBalanceValue,
          amount_added: amount_sats,
          message: `Added ${amount_sats} sats to your AI credits`,
        });
      }

      throw addError;
    }

    return apiSuccess({
      balance_sats: newBalance,
      amount_added: amount_sats,
      message: `Added ${amount_sats} sats to your AI credits`,
    });
  } catch (error) {
    logger.error('Failed to add credits', { error });
    return handleApiError(error);
  }
});
