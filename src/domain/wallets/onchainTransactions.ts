/**
 * On-chain transaction history for a wallet.
 *
 * "Show what the transactions are" needs more than a tx list: a transaction
 * that merely TOUCHES one of your addresses tells you nothing. What matters is
 * the NET movement for this wallet — outputs paid to it minus inputs spent from
 * it — which is the number a person reads as "I received 60,580 sats" or "I
 * sent 0.002 BTC".
 *
 * Server-side only. mempool.space must never be called from the browser: that
 * hands every visitor's IP and the owner's addresses to a third party. The same
 * lesson is already written into services/currency/rateSource.server.ts.
 */

import { deriveOnchainAddress } from '@/domain/payments/addressDerivation';
import { satsToBitcoin } from '@/services/currency';
import { BITCOIN_FETCH_TIMEOUT_MS } from '@/lib/wallets/constants';
import { logger } from '@/utils/logger';

const MEMPOOL_API = 'https://mempool.space/api';
/** BIP44 gap limit — stop after this many consecutive unused addresses. */
const GAP_LIMIT = 20;
/** Hard ceiling so a pathological key cannot issue unbounded requests. */
const MAX_SCAN = 60;
/** Most recent transactions returned to the caller. */
const MAX_TRANSACTIONS = 25;

export interface OnchainTransaction {
  txid: string;
  /**
   * Net movement for THIS wallet, in BTC. Positive = received, negative = sent.
   * Not the transaction's total value, which would be meaningless here.
   */
  netBtc: number;
  direction: 'in' | 'out';
  confirmed: boolean;
  /** Unix seconds; null while unconfirmed. */
  blockTime: number | null;
  /** mempool.space link, so the owner can verify independently. */
  explorerUrl: string;
}

interface MempoolVout {
  scriptpubkey_address?: string;
  value?: number;
}
interface MempoolTx {
  txid: string;
  vin?: { prevout?: MempoolVout }[];
  vout?: MempoolVout[];
  status?: { confirmed?: boolean; block_time?: number };
}

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BITCOIN_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (res.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    if (!res.ok) {
      throw new Error(`API_ERROR_${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The addresses this wallet actually uses.
 *
 * A plain address is itself. An extended key is scanned the same way the
 * balance is (gap limit), because mempool.space has no xpub endpoint at all —
 * see refreshBalance.ts for why that matters.
 */
async function walletAddresses(walletType: string, addressOrXpub: string): Promise<string[]> {
  if (walletType !== 'xpub') {
    return [addressOrXpub];
  }

  const used: string[] = [];
  let consecutiveEmpty = 0;
  for (let index = 0; index < MAX_SCAN && consecutiveEmpty < GAP_LIMIT; index += 1) {
    const address = deriveOnchainAddress(addressOrXpub, index);
    const stats = await getJson<{ chain_stats?: { tx_count?: number } }>(
      `${MEMPOOL_API}/address/${address}`
    );
    if ((stats.chain_stats?.tx_count ?? 0) === 0) {
      consecutiveEmpty += 1;
    } else {
      consecutiveEmpty = 0;
      used.push(address);
    }
  }
  return used;
}

/** Net sats this transaction moved for the given address set. */
function netSatsFor(tx: MempoolTx, owned: Set<string>): number {
  const received = (tx.vout ?? [])
    .filter(o => o.scriptpubkey_address && owned.has(o.scriptpubkey_address))
    .reduce((sum, o) => sum + (o.value ?? 0), 0);
  const spent = (tx.vin ?? [])
    .map(i => i.prevout)
    .filter((o): o is MempoolVout => Boolean(o?.scriptpubkey_address))
    .filter(o => owned.has(o.scriptpubkey_address!))
    .reduce((sum, o) => sum + (o.value ?? 0), 0);
  return received - spent;
}

/**
 * Recent on-chain transactions for a wallet, newest first.
 *
 * Throws on transport failure rather than returning an empty list — "no
 * transactions" and "we could not look" must not render identically, which is
 * the mistake that made every xpub balance read 0.
 */
export async function fetchWalletTransactions(
  walletType: string,
  addressOrXpub: string
): Promise<OnchainTransaction[]> {
  const addresses = await walletAddresses(walletType, addressOrXpub);
  if (addresses.length === 0) {
    return [];
  }

  const owned = new Set(addresses);
  const seen = new Map<string, OnchainTransaction>();

  for (const address of addresses) {
    const txs = await getJson<MempoolTx[]>(`${MEMPOOL_API}/address/${address}/txs`);
    for (const tx of txs) {
      // A transaction can touch several of our addresses; net it once.
      if (seen.has(tx.txid)) {
        continue;
      }
      const netSats = netSatsFor(tx, owned);
      seen.set(tx.txid, {
        txid: tx.txid,
        netBtc: satsToBitcoin(netSats),
        direction: netSats >= 0 ? 'in' : 'out',
        confirmed: tx.status?.confirmed ?? false,
        blockTime: tx.status?.block_time ?? null,
        explorerUrl: `https://mempool.space/tx/${tx.txid}`,
      });
    }
  }

  const all = [...seen.values()].sort(
    // Unconfirmed first (blockTime null), then newest.
    (a, b) => (b.blockTime ?? Number.MAX_SAFE_INTEGER) - (a.blockTime ?? Number.MAX_SAFE_INTEGER)
  );

  logger.info('Fetched on-chain transactions', {
    walletType,
    addressCount: addresses.length,
    txCount: all.length,
  });

  return all.slice(0, MAX_TRANSACTIONS);
}
