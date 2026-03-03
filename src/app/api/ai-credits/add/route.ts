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
  amount_sats: z.number().int().positive().min(1).max(1000000), // Max 1M sats for safety
  description: z.string().max(200).optional(),
});

/**
 * POST /api/ai-credits/add
 * Add credits to user's balance (admin only)
 */
export const POST = withRole('admin', async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

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
    const { data: newBalance, error: addError } = await db.rpc('add_ai_credits', {
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
        const { data: existingCredits } = await db
          .from(DATABASE_TABLES.AI_USER_CREDITS)
          .select('balance_sats')
          .eq('user_id', user.id)
          .single();

        const currentBalance = existingCredits?.balance_sats || 0;
        const newBalanceValue = currentBalance + amount_sats;

        const { error: upsertError } = await db.from(DATABASE_TABLES.AI_USER_CREDITS).upsert(
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
        await db.from(DATABASE_TABLES.AI_CREDIT_TRANSACTIONS).insert({
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
