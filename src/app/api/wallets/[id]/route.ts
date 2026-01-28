import { WalletFormData, validateAddressOrXpub, detectWalletType } from '@/types/wallet';
import { logger } from '@/utils/logger';
import { handleSupabaseError } from '@/lib/wallets/errorHandling';
import {
  apiSuccess,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiInternalError,
} from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

    const body = (await request.json()) as Partial<WalletFormData>;

    // Fetch wallet with ownership info
    const { data: walletData, error: fetchError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('wallets') as any
    )
      .select('*, profiles!wallets_profile_id_fkey(id), projects!wallets_project_id_fkey(user_id)')
      .eq('id', id)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wallet = walletData as any;

    if (fetchError || !wallet) {
      logger.error('Wallet not found', { walletId: id, error: fetchError?.message });
      return apiNotFound('Wallet not found');
    }

    // Check ownership
    interface WalletWithRelations {
      profiles?: { id: string } | null;
      projects?: { user_id: string } | null;
    }
    const walletWithRelations = wallet as WalletWithRelations;
    const ownerId = wallet.profile_id
      ? walletWithRelations.profiles?.id
      : wallet.project_id
        ? walletWithRelations.projects?.user_id
        : null;

    if (ownerId !== user.id) {
      logger.warn('Unauthorized wallet update attempt', { walletId: id, userId: user.id, ownerId });
      return apiForbidden('You do not have permission to update this wallet');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {};

    // Validate and update fields
    if (body.label !== undefined) {
      if (!body.label.trim()) {
        return apiBadRequest('Label cannot be empty');
      }
      updates.label = body.label.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (body.address_or_xpub !== undefined) {
      const validation = validateAddressOrXpub(body.address_or_xpub);
      if (!validation.valid) {
        return apiBadRequest(validation.error || 'Invalid address or xpub');
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
        await (
          supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from('wallets') as any
        )
          .update({ is_primary: false })
          .eq('is_active', true)
          .neq('id', id)
          .match(entityFilter);
      }
    }

    updates.updated_at = new Date().toISOString();

    // Update wallet
    const { data: updatedWallet, error: updateError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('wallets') as any
    )
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

    // Fetch wallet with ownership info
    const { data: walletData2, error: fetchError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('wallets') as any
    )
      .select('*, profiles!wallets_profile_id_fkey(id), projects!wallets_project_id_fkey(user_id)')
      .eq('id', id)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wallet = walletData2 as any;

    if (fetchError || !wallet) {
      logger.error('Wallet not found for deletion', { walletId: id, error: fetchError?.message });
      return apiNotFound('Wallet not found');
    }

    // Check ownership
    interface WalletWithRelations {
      profiles?: { id: string } | null;
      projects?: { user_id: string } | null;
    }
    const walletWithRelations = wallet as WalletWithRelations;
    const ownerId = wallet.profile_id
      ? walletWithRelations.profiles?.id
      : wallet.project_id
        ? walletWithRelations.projects?.user_id
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
    const { error: deleteError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('wallets') as any
    )
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
