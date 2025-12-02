import { NextRequest } from 'next/server';
import { createServerClient } from '@/services/supabase/server';
import { fetchBitcoinBalance } from '@/services/blockchain';
import { logger } from '@/utils/logger';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const API_TIMEOUT_MS = 10_000; // 10 seconds
const SATS_PER_BTC = 100_000_000;

/**
 * Fetch from external API with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Fetch xpub balance from mempool.space with error handling
 */
async function fetchXpubBalance(xpub: string): Promise<number> {
  try {
    const res = await fetchWithTimeout(
      `https://mempool.space/api/v1/xpub/${xpub}`,
      {
        headers: { Accept: 'application/json' },
      },
      API_TIMEOUT_MS
    );

    if (res.status === 429) {
      throw new Error('RATE_LIMITED');
    }

    if (res.status === 404) {
      // xpub not found or has no transactions
      return 0;
    }

    if (!res.ok) {
      throw new Error(`API_ERROR_${res.status}`);
    }

    const data = await res.json();
    const funded: number = data?.chain_stats?.funded_txo_sum ?? 0;
    const spent: number = data?.chain_stats?.spent_txo_sum ?? 0;
    const balanceSats = funded - spent;

    return balanceSats / SATS_PER_BTC;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Request timeout') {
        throw new Error('TIMEOUT');
      }
      if (error.message.startsWith('RATE_LIMITED') || error.message.startsWith('API_ERROR')) {
        throw error;
      }
    }
    throw new Error('NETWORK_ERROR');
  }
}

/**
 * POST /api/wallets/[id]/refresh - Refresh wallet balance
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Validate wallet ID
    const idValidation = getValidationError(validateUUID(id, 'wallet ID'));
    if (idValidation) {
      return idValidation;
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    // Get wallet
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !wallet) {
      logger.error('Wallet not found for refresh', { walletId: id, userId: user.id });
      return apiNotFound('Wallet not found');
    }

    // Verify ownership (redundant with query filter but explicit)
    if (wallet.user_id !== user.id) {
      logger.warn('Unauthorized balance refresh attempt', { walletId: id, userId: user.id });
      return apiForbidden('You do not have permission to refresh this wallet');
    }

    // Check cooldown
    if (wallet.balance_updated_at) {
      const lastUpdate = new Date(wallet.balance_updated_at).getTime();
      const now = Date.now();
      const timeSinceUpdate = now - lastUpdate;

      if (timeSinceUpdate < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceUpdate) / 1000);
        logger.info('Balance refresh rate limited', {
          walletId: id,
          userId: user.id,
          remainingSeconds,
        });
        return apiRateLimited(
          'Balance can only be refreshed every 5 minutes. Please wait.',
          remainingSeconds
        );
      }
    }

    // Refresh balance based on wallet type
    let totalBalanceBtc: number;

    try {
      if (wallet.wallet_type === 'address') {
        const balanceData = await fetchBitcoinBalance(wallet.address_or_xpub);
        totalBalanceBtc = balanceData.balance_btc;
      } else if (wallet.wallet_type === 'xpub') {
        totalBalanceBtc = await fetchXpubBalance(wallet.address_or_xpub);
      } else {
        logger.error('Invalid wallet type', { walletId: id, walletType: wallet.wallet_type });
        return apiBadRequest('Invalid wallet type');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Balance fetch failed', { walletId: id, error: errorMessage });

      if (errorMessage === 'TIMEOUT') {
        return apiInternalError('Balance fetch timed out. Please try again.', {
          status: 504,
        });
      }

      if (errorMessage === 'RATE_LIMITED') {
        return apiRateLimited(
          'Blockchain API rate limited. Please wait a few minutes and try again.',
          300 // 5 minutes
        );
      }

      if (errorMessage.startsWith('API_ERROR')) {
        return apiInternalError(
          'Blockchain API error. Please check your address/xpub and try again.',
          {
            status: 502,
          }
        );
      }

      if (errorMessage === 'NETWORK_ERROR') {
        return apiInternalError('Network error while fetching balance. Please try again.', {
          status: 503,
        });
      }

      return apiInternalError('Failed to fetch balance from blockchain');
    }

    // Validate balance
    if (typeof totalBalanceBtc !== 'number' || isNaN(totalBalanceBtc) || totalBalanceBtc < 0) {
      logger.error('Invalid balance received', { walletId: id, balance: totalBalanceBtc });
      return apiInternalError('Invalid balance received from blockchain');
    }

    // Update wallet balance
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update({
        balance_btc: totalBalanceBtc,
        balance_updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update wallet balance', { walletId: id, error: updateError.message });
      return apiInternalError('Failed to update wallet balance');
    }

    if (!updatedWallet) {
      logger.error('Wallet disappeared during update', { walletId: id });
      return apiInternalError('Wallet was deleted or ownership changed during update', {
        status: 409,
      });
    }

    // Audit log balance refresh
    await auditSuccess(AUDIT_ACTIONS.WALLET_BALANCE_REFRESHED, user.id, 'wallet', id, {
      previousBalance: wallet.balance_btc,
      newBalance: totalBalanceBtc,
      walletType: wallet.wallet_type,
    });

    logger.info('Balance refreshed successfully', {
      walletId: id,
      userId: user.id,
      balance: totalBalanceBtc,
    });

    return apiSuccess({
      wallet: updatedWallet,
      message: 'Balance refreshed successfully',
    });
  } catch (error) {
    logger.error('Unexpected balance refresh error', { error });
    return apiInternalError('Internal server error');
  }
}
