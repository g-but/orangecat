/**
 * AI Credits - Manual Add (admin only)
 *
 * POST /api/ai-credits/add - Manually add credits (admin or payment webhooks)
 */

import { z } from 'zod';
import { apiSuccess, handleApiError } from '@/lib/api/standardResponse';
import { withRole, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

// Schema for adding credits
const addCreditsSchema = z.object({
  amount_btc: z.number().int().positive().min(1).max(1000000), // Max 1M sats for safety
  description: z.string().max(200).optional(),
});

/**
 * POST /api/ai-credits/add
 * Add credits to user's balance (admin only)
 */
export const POST = withRole('admin', async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const body = await request.json();
    const result = addCreditsSchema.safeParse(body);

    if (!result.success) {
      return handleApiError({
        message: 'Invalid request',
        details: result.error.flatten(),
      });
    }

    const { amount_btc, description } = result.data;

    // Call the add_ai_credits RPC function
    const { data: newBalance, error: addError } = await supabase.rpc('add_ai_credits', {
      p_user_id: user.id,
      p_amount_btc: amount_btc,
      p_transaction_type: 'deposit',
      p_description: description || `Manual deposit of ${amount_btc} BTC`,
    });

    if (addError) {
      // If the RPC doesn't exist, try a direct insert approach
      if (addError.code === '42883') {
        logger.warn('add_ai_credits RPC not found, using direct insert');

        // Upsert the credits record
        const { data: existingCredits } = await supabase
          .from(DATABASE_TABLES.AI_USER_CREDITS)
          .select('balance_btc')
          .eq('user_id', user.id)
          .single();

        const currentBalance = existingCredits?.balance_btc || 0;
        const newBalanceValue = currentBalance + amount_btc;

        const { error: upsertError } = await supabase.from(DATABASE_TABLES.AI_USER_CREDITS).upsert(
          {
            user_id: user.id,
            balance_btc: newBalanceValue,
            total_deposited_btc: amount_btc,
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
        await supabase.from(DATABASE_TABLES.AI_CREDIT_TRANSACTIONS).insert({
          user_id: user.id,
          transaction_type: 'deposit',
          amount_btc,
          balance_before: currentBalance,
          balance_after: newBalanceValue,
          description: description || `Manual deposit of ${amount_btc} BTC`,
        });

        return apiSuccess({
          balance_btc: newBalanceValue,
          amount_added: amount_btc,
          message: `Added ${amount_btc} BTC to your AI credits`,
        });
      }

      throw addError;
    }

    return apiSuccess({
      balance_btc: newBalance,
      amount_added: amount_btc,
      message: `Added ${amount_btc} BTC to your AI credits`,
    });
  } catch (error) {
    logger.error('Failed to add credits', { error });
    return handleApiError(error);
  }
});
