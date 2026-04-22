/**
 * Wallet Balance Refresh Service
 *
 * Business logic for refreshing a wallet's on-chain balance.
 * Handles xpub resolution, cooldown enforcement, DB update, and audit logging.
 */

import { fetchBitcoinBalance } from '@/services/blockchain';
import { DATABASE_TABLES } from '@/config/database-tables';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { logger } from '@/utils/logger';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const API_TIMEOUT_MS = 10_000;
const SATS_PER_BTC = 100_000_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {throw new Error('TIMEOUT');}
    throw new Error('NETWORK_ERROR');
  }
}

async function fetchXpubBalance(xpub: string): Promise<number> {
  const res = await fetchWithTimeout(
    `https://mempool.space/api/v1/xpub/${xpub}`,
    { headers: { Accept: 'application/json' } },
    API_TIMEOUT_MS
  );
  if (res.status === 429) {throw new Error('RATE_LIMITED');}
  if (res.status === 404) {return 0;}
  if (!res.ok) {throw new Error(`API_ERROR_${res.status}`);}
  const data = await res.json();
  const funded: number = data?.chain_stats?.funded_txo_sum ?? 0;
  const spent: number = data?.chain_stats?.spent_txo_sum ?? 0;
  return (funded - spent) / SATS_PER_BTC;
}

export type RefreshResult =
  | { ok: true; wallet: Record<string, unknown> }
  | { ok: false; code: 'COOLDOWN'; remainingSeconds: number }
  | { ok: false; code: 'INVALID_TYPE' }
  | { ok: false; code: 'TIMEOUT' }
  | { ok: false; code: 'RATE_LIMITED' }
  | { ok: false; code: 'API_ERROR' }
  | { ok: false; code: 'NETWORK_ERROR' }
  | { ok: false; code: 'INVALID_BALANCE' }
  | { ok: false; code: 'UPDATE_FAILED' };

export async function refreshWalletBalance(
  supabase: AnyClient,
  walletId: string,
  userId: string,
  wallet: Record<string, unknown>
): Promise<RefreshResult> {
  // Cooldown check
  if (wallet.balance_updated_at) {
    const timeSince = Date.now() - new Date(wallet.balance_updated_at as string).getTime();
    if (timeSince < COOLDOWN_MS) {
      return { ok: false, code: 'COOLDOWN', remainingSeconds: Math.ceil((COOLDOWN_MS - timeSince) / 1000) };
    }
  }

  // Fetch balance from chain
  let totalBalanceBtc: number;
  try {
    if (wallet.wallet_type === 'address') {
      const data = await fetchBitcoinBalance(wallet.address_or_xpub as string);
      totalBalanceBtc = data.balance_btc;
    } else if (wallet.wallet_type === 'xpub') {
      totalBalanceBtc = await fetchXpubBalance(wallet.address_or_xpub as string);
    } else {
      return { ok: false, code: 'INVALID_TYPE' };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'TIMEOUT') {return { ok: false, code: 'TIMEOUT' };}
    if (msg === 'RATE_LIMITED') {return { ok: false, code: 'RATE_LIMITED' };}
    if (msg.startsWith('API_ERROR')) {return { ok: false, code: 'API_ERROR' };}
    return { ok: false, code: 'NETWORK_ERROR' };
  }

  if (typeof totalBalanceBtc !== 'number' || isNaN(totalBalanceBtc) || totalBalanceBtc < 0) {
    return { ok: false, code: 'INVALID_BALANCE' };
  }

  // Persist
  const { data: updatedWallet, error: updateError } = await supabase
    .from(DATABASE_TABLES.WALLETS)
    .update({ balance_btc: totalBalanceBtc, balance_updated_at: new Date().toISOString() })
    .eq('id', walletId)
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError || !updatedWallet) {
    logger.error('Failed to update wallet balance', { walletId, error: updateError?.message });
    return { ok: false, code: 'UPDATE_FAILED' };
  }

  await auditSuccess(AUDIT_ACTIONS.WALLET_BALANCE_REFRESHED, userId, 'wallet', walletId, {
    previousBalance: wallet.balance_btc,
    newBalance: totalBalanceBtc,
    walletType: wallet.wallet_type,
  });

  return { ok: true, wallet: updatedWallet as Record<string, unknown> };
}
