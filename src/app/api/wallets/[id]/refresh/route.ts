/**
 * Wallet Balance Refresh API
 *
 * POST /api/wallets/[id]/refresh - Refresh wallet balance from blockchain
 */

import { logger } from '@/utils/logger';
import {
  apiSuccess,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { DATABASE_TABLES } from '@/config/database-tables';
import { refreshWalletBalance } from '@/domain/wallets/refreshBalance';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'wallet ID'));
  if (idValidation) return idValidation;

  try {
    const { user, supabase } = request;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: wallet, error: fetchError } = await (supabase.from(DATABASE_TABLES.WALLETS) as any)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !wallet) {
      logger.error('Wallet not found for refresh', { walletId: id, userId: user.id });
      return apiNotFound('Wallet not found');
    }

    if (wallet.user_id !== user.id) {
      return apiForbidden('You do not have permission to refresh this wallet');
    }

    const result = await refreshWalletBalance(supabase, id, user.id, wallet);

    if (!result.ok) {
      switch (result.code) {
        case 'COOLDOWN':
          return apiRateLimited('Balance can only be refreshed every 5 minutes. Please wait.', result.remainingSeconds);
        case 'INVALID_TYPE':
          return apiBadRequest('Invalid wallet type');
        case 'TIMEOUT':
          return apiInternalError('Balance fetch timed out. Please try again.', { status: 504 });
        case 'RATE_LIMITED':
          return apiRateLimited('Blockchain API rate limited. Please wait a few minutes and try again.', 300);
        case 'API_ERROR':
          return apiInternalError('Blockchain API error. Please check your address/xpub and try again.', { status: 502 });
        case 'NETWORK_ERROR':
          return apiInternalError('Network error while fetching balance. Please try again.', { status: 503 });
        case 'INVALID_BALANCE':
          return apiInternalError('Invalid balance received from blockchain');
        case 'UPDATE_FAILED':
          return apiInternalError('Failed to update wallet balance');
      }
    }

    logger.info('Balance refreshed successfully', { walletId: id, userId: user.id });
    return apiSuccess({ wallet: result.wallet, message: 'Balance refreshed successfully' });
  } catch (error) {
    logger.error('Unexpected balance refresh error', { error });
    return apiInternalError('Internal server error');
  }
});
