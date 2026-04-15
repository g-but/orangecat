/**
 * Wallet Transfer API
 *
 * POST /api/wallets/transfer - Transfer between user's wallets
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { type Wallet } from '@/types/wallet';
import { logger } from '@/utils/logger';
import {
  apiSuccess,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiRateLimited,
  apiInternalError,
} from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { DATABASE_TABLES } from '@/config/database-tables';
import { enforceUserWriteLimit, RateLimitError } from '@/lib/api/rateLimiting';
import { walletTransferSchema } from '@/lib/validation/finance';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    // Rate limiting — 30 writes per minute per user
    try {
      await enforceUserWriteLimit(user.id);
    } catch (e) {
      if (e instanceof RateLimitError) {
        const retryAfter = e.details?.retryAfter || 60;
        logger.info('Wallet transfer rate limit exceeded', { userId: user.id });
        return apiRateLimited('Too many transfer requests. Please slow down.', retryAfter);
      }
      throw e;
    }

    // Validate input with Zod schema
    const rawBody = await request.json();
    const parseResult = walletTransferSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return apiBadRequest('Invalid input', parseResult.error.errors);
    }
    const body = parseResult.data;

    // Fetch both wallets and verify ownership
    const { data: walletsData, error: walletsError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(DATABASE_TABLES.WALLETS) as any
    )
      .select('id, user_id, label, balance_btc, profile_id, project_id')
      .in('id', [body.from_wallet_id, body.to_wallet_id])
      .eq('is_active', true);
    const wallets = walletsData as Wallet[] | null;

    if (walletsError) {
      logger.error('Failed to fetch wallets for transfer', {
        userId: user.id,
        fromWalletId: body.from_wallet_id,
        toWalletId: body.to_wallet_id,
        error: walletsError.message,
      });
      return apiInternalError('Failed to fetch wallet information');
    }

    if (!wallets || wallets.length !== 2) {
      logger.warn('One or both wallets not found for transfer', {
        userId: user.id,
        fromWalletId: body.from_wallet_id,
        toWalletId: body.to_wallet_id,
        walletsFound: wallets?.length || 0,
      });
      return apiNotFound('One or both wallets not found');
    }

    const fromWallet = wallets.find(w => w.id === body.from_wallet_id);
    const toWallet = wallets.find(w => w.id === body.to_wallet_id);

    if (!fromWallet || !toWallet) {
      logger.error('Wallet lookup failed after fetch', {
        userId: user.id,
        fromWalletId: body.from_wallet_id,
        toWalletId: body.to_wallet_id,
      });
      return apiNotFound('Wallet not found');
    }

    // Verify both wallets belong to the user
    if (fromWallet.user_id !== user.id || toWallet.user_id !== user.id) {
      logger.warn('Unauthorized wallet transfer attempt', {
        userId: user.id,
        fromWalletUserId: fromWallet.user_id,
        toWalletUserId: toWallet.user_id,
      });
      return apiForbidden('You can only transfer between your own wallets');
    }

    // Check sufficient balance (both in BTC)
    if (fromWallet.balance_btc < body.amount_btc) {
      logger.info('Insufficient balance for transfer', {
        userId: user.id,
        fromWalletId: body.from_wallet_id,
        availableBtc: fromWallet.balance_btc,
        requestedBtc: body.amount_btc,
      });
      return apiBadRequest(
        `Insufficient balance. Available: ${fromWallet.balance_btc} BTC, Requested: ${body.amount_btc} BTC`
      );
    }

    const amount_btc = body.amount_btc;

    // Determine entity types for transaction record
    const from_entity_type = fromWallet.profile_id ? 'profile' : 'project';
    const from_entity_id = fromWallet.profile_id || fromWallet.project_id;
    const to_entity_type = toWallet.profile_id ? 'profile' : 'project';
    const to_entity_id = toWallet.profile_id || toWallet.project_id;

    // Create transaction record (marked as internal transfer)
    const { data: transactionData, error: txError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(DATABASE_TABLES.TRANSACTIONS) as any
    )
      .insert({
        amount_btc,
        from_entity_type,
        from_entity_id,
        to_entity_type,
        to_entity_id,
        payment_method: 'bitcoin',
        message: body.note || `Transfer from ${fromWallet.label} to ${toWallet.label}`,
        purpose: 'internal_transfer',
        anonymous: false,
        public_visibility: false, // Internal transfers are private
        status: 'completed', // Internal transfers complete immediately
        initiated_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        settled_at: new Date().toISOString(),
      })
      .select()
      .single();
    const transaction = transactionData as { id: string } & Record<string, unknown>;

    if (txError) {
      logger.error('Failed to create transaction record', {
        userId: user.id,
        fromWalletId: body.from_wallet_id,
        toWalletId: body.to_wallet_id,
        error: txError.message,
      });
      return apiInternalError('Failed to create transaction record');
    }

    // Update wallet balances using RPC function (amount already in BTC)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.rpc as any)('transfer_between_wallets', {
      p_from_wallet_id: body.from_wallet_id,
      p_to_wallet_id: body.to_wallet_id,
      p_amount_btc: body.amount_btc,
      p_transaction_id: transaction.id,
    });

    if (updateError) {
      logger.error('Failed to update wallet balances', {
        userId: user.id,
        transactionId: transaction.id,
        error: updateError.message,
      });
      return apiInternalError('Failed to update wallet balances');
    }

    // Fetch updated wallets
    const { data: updatedWalletsData } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(DATABASE_TABLES.WALLETS) as any
    )
      .select('*')
      .in('id', [body.from_wallet_id, body.to_wallet_id]);
    const updatedWallets = updatedWalletsData as Wallet[] | null;

    // Audit log wallet transfer
    await auditSuccess(
      AUDIT_ACTIONS.WALLET_BALANCE_REFRESHED,
      user.id,
      'wallet',
      body.from_wallet_id,
      {
        action: 'transfer',
        fromWalletId: body.from_wallet_id,
        toWalletId: body.to_wallet_id,
        amountBtc: body.amount_btc,
        transactionId: transaction.id,
        fromWalletLabel: fromWallet.label,
        toWalletLabel: toWallet.label,
      }
    );

    logger.info('Wallet transfer completed successfully', {
      userId: user.id,
      fromWalletId: body.from_wallet_id,
      toWalletId: body.to_wallet_id,
      amountBtc: body.amount_btc,
      transactionId: transaction.id,
    });

    return apiSuccess({
      transaction,
      wallets: updatedWallets,
      message: `Transferred ${body.amount_btc} BTC from ${fromWallet.label} to ${toWallet.label}`,
    });
  } catch (error) {
    logger.error('Unexpected error in wallet transfer', { error });
    return apiInternalError('Internal server error');
  }
});
