/**
 * Wallet Transfer API
 *
 * POST /api/wallets/transfer - Transfer between user's wallets
 */

import { logger } from '@/utils/logger';
import {
  apiSuccess,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiInternalError,
} from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { enforceUserWriteLimit, handleRateLimitError } from '@/lib/api/rateLimiting';
import { walletTransferSchema } from '@/lib/validation/finance';
import { executeWalletTransfer } from '@/domain/wallets/transferService';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    try {
      await enforceUserWriteLimit(user.id);
    } catch (e) {
      const limited = handleRateLimitError(e, 'Too many transfer requests. Please slow down.');
      if (limited) return limited;
      throw e;
    }

    const rawBody = await request.json();
    const parseResult = walletTransferSchema.safeParse(rawBody);
    if (!parseResult.success) return apiBadRequest('Invalid input', parseResult.error.errors);
    const body = parseResult.data;

    const result = await executeWalletTransfer(
      supabase,
      user.id,
      body.from_wallet_id,
      body.to_wallet_id,
      body.amount_btc,
      body.note
    );

    if (!result.ok) {
      switch (result.code) {
        case 'NOT_FOUND': return apiNotFound(result.message);
        case 'FORBIDDEN': return apiForbidden(result.message);
        case 'INSUFFICIENT_BALANCE': return apiBadRequest(result.message);
        case 'TX_ERROR': return apiInternalError(result.message);
        case 'UPDATE_ERROR': return apiInternalError(result.message);
      }
    }

    return apiSuccess({ transaction: result.transaction, wallets: result.wallets, message: result.message });
  } catch (error) {
    logger.error('Unexpected error in wallet transfer', { error });
    return apiInternalError('Internal server error');
  }
});
