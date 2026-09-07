/**
 * Wallet Balance Refresh Service
 *
 * Business logic for refreshing a wallet's on-chain balance.
 * Handles xpub resolution, cooldown enforcement, DB update, and audit logging.
 */

import { fetchBitcoinBalance } from '@/services/blockchain';
import { DATABASE_TABLES, WALLET_CLIENT_COLUMNS } from '@/config/database-tables';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { logger } from '@/utils/logger';
import { BITCOIN_FETCH_TIMEOUT_MS } from '@/lib/wallets/constants';
import { satsToBitcoin } from '@/services/currency';
import { deriveOnchainAddress } from '@/domain/payments/addressDerivation';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const API_TIMEOUT_MS = BITCOIN_FETCH_TIMEOUT_MS;

type AnyClient = any;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw new Error('NETWORK_ERROR');
  }
}

/**
 * Stop scanning after this many consecutive unused addresses (BIP44 gap limit).
 * 20 is the wallet-industry default; going lower risks missing funds that a
 * normal wallet would find.
 */
const GAP_LIMIT = 20;
/** Hard ceiling so a pathological key cannot issue unbounded requests. */
const MAX_SCAN = 60;

/** Chain stats for one address, in sats. */
async function fetchAddressStats(
  address: string
): Promise<{ balanceSats: number; txCount: number }> {
  const res = await fetchWithTimeout(
    `https://mempool.space/api/address/${address}`,
    { headers: { Accept: 'application/json' } },
    API_TIMEOUT_MS
  );
  if (res.status === 429) {
    throw new Error('RATE_LIMITED');
  }
  if (!res.ok) {
    throw new Error(`API_ERROR_${res.status}`);
  }
  const d = await res.json();
  const c = d?.chain_stats ?? {};
  const m = d?.mempool_stats ?? {};
  const balanceSats =
    (c.funded_txo_sum ?? 0) -
    (c.spent_txo_sum ?? 0) +
    (m.funded_txo_sum ?? 0) -
    (m.spent_txo_sum ?? 0);
  return { balanceSats, txCount: (c.tx_count ?? 0) + (m.tx_count ?? 0) };
}

/**
 * Sum an extended key's receive chain by deriving addresses locally.
 *
 * This used to call `mempool.space/api/v1/xpub/<key>` — an endpoint that DOES
 * NOT EXIST. Every variant of it 404s (verified 2026-09-07), and the 404 was
 * mapped to `return 0`. So every xpub wallet reported exactly 0.00000000 BTC,
 * forever, and the card stamped it "Updated <time>": a number nobody had
 * measured, presented as freshly read from the blockchain. A wallet holding
 * funds looked empty, which is the one failure a balance display must never
 * have.
 *
 * mempool.space has no xpub support at all, so the addresses are derived here
 * (deriveOnchainAddress already backs per-invoice addresses) and summed with a
 * standard gap-limit scan. An error now propagates instead of becoming a zero.
 */
async function fetchXpubBalance(xpub: string): Promise<number> {
  let totalSats = 0;
  let consecutiveEmpty = 0;

  for (let index = 0; index < MAX_SCAN && consecutiveEmpty < GAP_LIMIT; index += 1) {
    const address = deriveOnchainAddress(xpub, index);
    const { balanceSats, txCount } = await fetchAddressStats(address);
    if (txCount === 0) {
      consecutiveEmpty += 1;
    } else {
      consecutiveEmpty = 0;
      totalSats += balanceSats;
    }
  }

  return satsToBitcoin(totalSats);
}

type RefreshResult =
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
      return {
        ok: false,
        code: 'COOLDOWN',
        remainingSeconds: Math.ceil((COOLDOWN_MS - timeSince) / 1000),
      };
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
    if (msg === 'TIMEOUT') {
      return { ok: false, code: 'TIMEOUT' };
    }
    if (msg === 'RATE_LIMITED') {
      return { ok: false, code: 'RATE_LIMITED' };
    }
    if (msg.startsWith('API_ERROR')) {
      return { ok: false, code: 'API_ERROR' };
    }
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
    .select(WALLET_CLIENT_COLUMNS)
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
