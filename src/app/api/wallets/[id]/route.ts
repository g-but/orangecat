import { validateAddressOrXpub, detectWalletType, type Wallet } from '@/types/wallet';
import { logger } from '@/utils/logger';
import { handleSupabaseError } from '@/lib/wallets/errorHandling';
import {
  apiSuccess,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiRateLimited,
  apiInternalError,
} from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { DATABASE_TABLES } from '@/config/database-tables';
import { enforceUserWriteLimit, RateLimitError } from '@/lib/api/rateLimiting';
import { walletUpdateSchema } from '@/lib/validation/finance';

interface RouteContext {
  params: Promise<{ id: string }>;
}

type WalletWithRelations = Wallet & {
  profiles?: { id: string } | null;
  projects?: { user_id: string } | null;
};

// PATCH /api/wallets/[id] - Update wallet
export const PATCH = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;

    // Validate wallet ID format
    const idValidation = getValidationError(validateUUID(id, 'wallet ID'));
    if (idValidation) {
      return idValidation;
    }

    const { user, supabase } = request;

    // Rate limiting — 30 writes per minute per user
    try {
      await enforceUserWriteLimit(user.id);
    } catch (e) {
      if (e instanceof RateLimitError) {
        const retryAfter = e.details?.retryAfter || 60;
        logger.info('Wallet update rate limit exceeded', { userId: user.id });
        return apiRateLimited('Too many wallet update requests. Please slow down.', retryAfter);
      }
      throw e;
    }

    // Validate request body with Zod
    const rawBody = await request.json();
    const parseResult = walletUpdateSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return apiBadRequest('Invalid input', parseResult.error.errors);
    }
    const body = parseResult.data;

    // Fetch wallet with ownership info
    const { data: walletData, error: fetchError } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .select('*, profiles!wallets_profile_id_fkey(id), projects!wallets_project_id_fkey(user_id)')
      .eq('id', id)
      .single();
    const wallet = walletData as WalletWithRelations | null;

    if (fetchError || !wallet) {
      logger.error('Wallet not found', { walletId: id, error: fetchError?.message });
      return apiNotFound('Wallet not found');
    }

    // Check ownership
    const ownerId = wallet.profile_id
      ? wallet.profiles?.id
      : wallet.project_id
        ? wallet.projects?.user_id
        : null;

    if (ownerId !== user.id) {
      logger.warn('Unauthorized wallet update attempt', { walletId: id, userId: user.id, ownerId });
      return apiForbidden('You do not have permission to update this wallet');
    }

    const updates: Partial<Wallet> = {};

    // Build updates from Zod-validated body
    if (body.label !== undefined) {
      updates.label = body.label.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (body.address_or_xpub !== undefined) {
      // Zod validates format/length; validateAddressOrXpub checks Bitcoin-specific checksum
      const addressValidation = validateAddressOrXpub(body.address_or_xpub);
      if (!addressValidation.valid) {
        return apiBadRequest(addressValidation.error || 'Invalid address or xpub');
      }
      updates.address_or_xpub = body.address_or_xpub.trim();
      updates.wallet_type = detectWalletType(body.address_or_xpub);
      // Reset balance when address changes
      updates.balance_btc = 0;
      updates.balance_updated_at = null;
    }

    if (body.category !== undefined) {
      updates.category = body.category;
    }

    if (body.category_icon !== undefined) {
      updates.category_icon = body.category_icon;
    }

    if (body.goal_amount !== undefined) {
      updates.goal_amount = body.goal_amount || null;
    }

    if (body.goal_currency !== undefined) {
      updates.goal_currency = body.goal_currency || null;
    }

    if (body.goal_deadline !== undefined) {
      updates.goal_deadline = body.goal_deadline || null;
    }

    // Handle is_primary: if setting to true, unset all other wallets for this entity
    if (body.is_primary !== undefined) {
      updates.is_primary = body.is_primary;

      if (body.is_primary === true) {
        const entityFilter = wallet.profile_id
          ? { profile_id: wallet.profile_id }
          : { project_id: wallet.project_id };

        // Unset all other wallets as primary
        await supabase
          .from(DATABASE_TABLES.WALLETS)
          .update({ is_primary: false })
          .eq('is_active', true)
          .neq('id', id)
          .match(entityFilter);
      }
    }

    updates.updated_at = new Date().toISOString();

    // Update wallet
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

    // Audit log wallet update
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

// DELETE /api/wallets/[id] - Delete wallet (soft delete)
export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;

    // Validate wallet ID format
    const idValidation = getValidationError(validateUUID(id, 'wallet ID'));
    if (idValidation) {
      return idValidation;
    }

    const { user, supabase } = request;

    // Rate limit
    try {
      await enforceUserWriteLimit(user.id);
    } catch (e) {
      if (e instanceof RateLimitError) {
        return apiRateLimited();
      }
      throw e;
    }

    // Fetch wallet with ownership info
    const { data: walletData2, error: fetchError } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .select('*, profiles!wallets_profile_id_fkey(id), projects!wallets_project_id_fkey(user_id)')
      .eq('id', id)
      .single();
    const wallet = walletData2 as WalletWithRelations | null;

    if (fetchError || !wallet) {
      logger.error('Wallet not found for deletion', { walletId: id, error: fetchError?.message });
      return apiNotFound('Wallet not found');
    }

    // Check ownership
    const ownerId = wallet.profile_id
      ? wallet.profiles?.id
      : wallet.project_id
        ? wallet.projects?.user_id
        : null;

    if (ownerId !== user.id) {
      logger.warn('Unauthorized wallet deletion attempt', {
        walletId: id,
        userId: user.id,
        ownerId,
      });
      return apiForbidden('You do not have permission to delete this wallet');
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      logger.error('Failed to delete wallet', { walletId: id, error: deleteError.message });
      return handleSupabaseError('delete wallet', deleteError, { walletId: id });
    }

    // Audit log wallet deletion
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
