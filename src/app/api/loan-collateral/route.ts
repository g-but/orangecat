/**
 * Loan Collateral API
 *
 * POST /api/loan-collateral - Attach collateral to a loan
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiForbidden, apiValidationError, apiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { getTableName } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getOrCreateUserActor } from '@/services/actors/getOrCreateUserActor';

const CollateralSchema = z.object({
  loan_id: z.string().min(1),
  asset_id: z.string().min(1),
  pledged_value: z.number().positive().optional().nullable(),
  currency: z.string().min(3).max(6).optional().default('USD'),
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user, supabase } = req;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiValidationError('Invalid request body');
    }

    const validation = CollateralSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError('Validation failed', {
        fields: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const data = validation.data;

    // Resolve user to actor for ownership checks
    const actor = await getOrCreateUserActor(user.id);

    // Verify ownership of loan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: loan, error: loanErr } = await (supabase.from(getTableName('loan')) as any)
      .select('id, actor_id')
      .eq('id', data.loan_id)
      .single();

    if (loanErr || !loan || loan.actor_id !== actor.id) {
      return apiForbidden('Loan not found or not owned');
    }

    // Verify ownership of asset
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: asset, error: assetErr } = await (supabase.from(getTableName('asset')) as any)
      .select('id, actor_id')
      .eq('id', data.asset_id)
      .single();

    if (assetErr || !asset || asset.actor_id !== actor.id) {
      return apiForbidden('Asset not found or not owned');
    }

    // Insert collateral link
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error } = await (supabase.from(DATABASE_TABLES.LOAN_COLLATERAL) as any)
      .insert({
        loan_id: data.loan_id,
        asset_id: data.asset_id,
        owner_id: user.id,
        pledged_value: data.pledged_value ?? null,
        currency: data.currency || PLATFORM_DEFAULT_CURRENCY,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to attach collateral', { error }, 'LoanCollateral');
      return apiError('Failed to attach collateral');
    }

    return apiSuccess({ id: created.id });
  } catch (error) {
    logger.error('Loan collateral error', { error }, 'LoanCollateral');
    return apiError('Failed to attach collateral');
  }
});
