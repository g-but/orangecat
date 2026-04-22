/**
 * Wallet by ID API Routes
 *
 * PATCH  /api/wallets/[id] - Update a wallet
 * DELETE /api/wallets/[id] - Soft-delete a wallet
 */

import { logger } from '@/utils/logger';
import { handleSupabaseError } from '@/lib/wallets/errorHandling';
import { apiSuccess, apiInternalError, apiBadRequest } from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { DATABASE_TABLES } from '@/config/database-tables';
import { enforceUserWriteLimit, handleRateLimitError } from '@/lib/api/rateLimiting';
import { walletUpdateSchema } from '@/lib/validation/finance';
import {
  fetchWalletAndVerifyOwner,
  buildWalletUpdates,
  enforceSinglePrimary,
} from '@/domain/wallets/updateWallet';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/wallets/[id] - Update wallet
export const PATCH = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const idValidation = getValidationError(validateUUID(id, 'wallet ID'));
    if (idValidation) return idValidation;

    const { user, supabase } = request;

    try {
      await enforceUserWriteLimit(user.id);
    } catch (e) {
      const limited = handleRateLimitError(e, 'Too many wallet update requests. Please slow down.');
      if (limited) return limited;
      throw e;
    }

    const rawBody = await request.json();
    const parseResult = walletUpdateSchema.safeParse(rawBody);
    if (!parseResult.success) return apiBadRequest('Invalid input', parseResult.error.errors);

    const result = await fetchWalletAndVerifyOwner(supabase, id, user.id, 'update');
    if (result.error) return result.error;
    const { wallet } = result;

    const updateResult = buildWalletUpdates(parseResult.data);
    if (updateResult.error) return updateResult.error;
    const { updates } = updateResult;

    if (parseResult.data.is_primary === true) {
      await enforceSinglePrimary(supabase, wallet, id);
    }

    const { data: updatedWallet, error: updateError } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update wallet', { walletId: id, error: updateError.message });
      return handleSupabaseError('update wallet', updateError, { walletId: id });
    }

    await auditSuccess(AUDIT_ACTIONS.WALLET_UPDATED, user.id, 'wallet', id, {
      updatedFields: Object.keys(updates),
      category: updates.category || wallet.category,
    });

    logger.info('Wallet updated successfully', { walletId: id, userId: user.id });
    return apiSuccess(updatedWallet);
  } catch (error) {
    logger.error('Unexpected error updating wallet', { error });
    return apiInternalError('Failed to update wallet');
  }
});

// DELETE /api/wallets/[id] - Soft-delete wallet
export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const idValidation = getValidationError(validateUUID(id, 'wallet ID'));
    if (idValidation) return idValidation;

    const { user, supabase } = request;

    try {
      await enforceUserWriteLimit(user.id);
    } catch (e) {
      const limited = handleRateLimitError(e);
      if (limited) return limited;
      throw e;
    }

    const result = await fetchWalletAndVerifyOwner(supabase, id, user.id, 'delete');
    if (result.error) return result.error;
    const { wallet } = result;

    const { error: deleteError } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      logger.error('Failed to delete wallet', { walletId: id, error: deleteError.message });
      return handleSupabaseError('delete wallet', deleteError, { walletId: id });
    }

    await auditSuccess(AUDIT_ACTIONS.WALLET_DELETED, user.id, 'wallet', id, {
      category: wallet.category,
      entityType: wallet.profile_id ? 'profile' : 'project',
      entityId: wallet.profile_id || wallet.project_id,
    });

    logger.info('Wallet deleted successfully', { walletId: id, userId: user.id });
    return apiSuccess({ success: true, message: 'Wallet deleted successfully' });
  } catch (error) {
    logger.error('Unexpected error deleting wallet', { error });
    return apiInternalError('Failed to delete wallet');
  }
});
