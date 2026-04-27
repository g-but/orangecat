/**
 * Mempool.space API Client
 *
 * Checks on-chain Bitcoin payment status by querying the public Mempool.space API.
 * Used to verify that on-chain payments have actually arrived, replacing the
 * previous trust-based "buyer confirmed" flow for on-chain payments.
 *
 * Rate limit: Mempool.space allows ~10 req/s for the public API.
 * No API key required.
 */

import { logger } from '@/utils/logger';
import { BITCOIN_FETCH_TIMEOUT_MS } from '@/lib/wallets/constants';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MEMPOOL_API_MAINNET = 'https://mempool.space/api';
const MEMPOOL_API_TESTNET = 'https://mempool.space/testnet/api';

const MEMPOOL_API =
  process.env.NEXT_PUBLIC_BITCOIN_NETWORK === 'testnet' ? MEMPOOL_API_TESTNET : MEMPOOL_API_MAINNET;

/** How long to cache the current block height (ms) */
const BLOCK_HEIGHT_CACHE_TTL_MS = 30_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MempoolTransaction {
  txid: string;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_time?: number;
  };
  vout: Array<{
    scriptpubkey_address: string;
    /** Value in satoshis */
    value: number;
  }>;
}

export interface OnchainPaymentCheck {
  /** Whether a matching payment was found */
  found: boolean;
  /** Transaction ID if found */
  txid?: string;
  /** Number of confirmations (0 = in mempool) */
  confirmations?: number;
  /** Actual amount received in satoshis */
  amountSats?: number;
}

// ---------------------------------------------------------------------------
// Block height cache
// ---------------------------------------------------------------------------

let cachedBlockHeight: number | null = null;
let blockHeightCachedAt = 0;

async function getCurrentBlockHeight(): Promise<number> {
  const now = Date.now();
  if (cachedBlockHeight !== null && now - blockHeightCachedAt < BLOCK_HEIGHT_CACHE_TTL_MS) {
    return cachedBlockHeight;
  }

  const response = await fetch(`${MEMPOOL_API}/blocks/tip/height`, {
    signal: AbortSignal.timeout(BITCOIN_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Mempool API /blocks/tip/height returned ${response.status}`);
  }

  const height = parseInt(await response.text(), 10);
  if (isNaN(height)) {
    throw new Error('Mempool API returned invalid block height');
  }

  cachedBlockHeight = height;
  blockHeightCachedAt = now;
  return height;
}

// ---------------------------------------------------------------------------
// Address transaction lookup
// ---------------------------------------------------------------------------

/**
 * Fetch recent transactions for an address.
 * Returns both confirmed and unconfirmed (mempool) transactions.
 */
async function getAddressTransactions(address: string): Promise<MempoolTransaction[]> {
  const response = await fetch(`${MEMPOOL_API}/address/${address}/txs`, {
    signal: AbortSignal.timeout(BITCOIN_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Mempool API /address/${address}/txs returned ${response.status}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if an address has received a payment of at least the expected amount.
 *
 * Looks at all transactions for the address and finds one whose outputs
 * pay at least `expectedAmountSats` to the address. Optionally filters
 * to transactions after `sinceTimestamp` (confirmed block_time).
 *
 * Handles Mempool API errors gracefully — returns `{ found: false }` on failure
 * so that callers never break when the API is unavailable.
 */
export async function checkAddressPayment(params: {
  address: string;
  expectedAmountSats: number;
  /** Unix timestamp — ignore confirmed txs with block_time before this */
  sinceTimestamp?: number;
}): Promise<OnchainPaymentCheck> {
  const { address, expectedAmountSats, sinceTimestamp } = params;

  try {
    const [transactions, tipHeight] = await Promise.all([
      getAddressTransactions(address),
      getCurrentBlockHeight(),
    ]);

    for (const tx of transactions) {
      // If sinceTimestamp is set, skip confirmed transactions that are too old
      if (
        sinceTimestamp &&
        tx.status.confirmed &&
        tx.status.block_time &&
        tx.status.block_time < sinceTimestamp
      ) {
        continue;
      }

      // Sum the value of all outputs paying to the target address
      const receivedSats = tx.vout
        .filter(out => out.scriptpubkey_address === address)
        .reduce((sum, out) => sum + out.value, 0);

      if (receivedSats >= expectedAmountSats) {
        const confirmations =
          tx.status.confirmed && tx.status.block_height
            ? tipHeight - tx.status.block_height + 1
            : 0;

        return {
          found: true,
          txid: tx.txid,
          confirmations,
          amountSats: receivedSats,
        };
      }
    }

    return { found: false };
  } catch (error) {
    // Mempool API failure should never break the payment flow
    logger.warn(
      'Mempool API check failed',
      {
        address,
        error: error instanceof Error ? error.message : String(error),
      },
      'mempool'
    );

    return { found: false };
  }
}
