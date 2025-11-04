'use server';

export interface BitcoinBalance {
  balance_btc: number;
  tx_count: number;
  updated_at: string;
}

/**
 * Fetches Bitcoin address balance from mempool.space public API.
 * Returns BTC balance computed from funded - spent outputs.
 */
export async function fetchBitcoinBalance(address: string): Promise<BitcoinBalance> {
  const res = await fetch(`https://mempool.space/api/address/${address}`, {
    headers: { Accept: 'application/json' },
    // Cache for 5 minutes to limit API load while still allowing manual refresh
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Mempool API error: ${res.status}`);
  }

  const data = await res.json();
  const funded: number = data?.chain_stats?.funded_txo_sum ?? 0;
  const spent: number = data?.chain_stats?.spent_txo_sum ?? 0;
  const txCount: number = data?.chain_stats?.tx_count ?? 0;
  const balanceSats = funded - spent;

  return {
    balance_btc: balanceSats / 100_000_000,
    tx_count: txCount,
    updated_at: new Date().toISOString(),
  };
}
