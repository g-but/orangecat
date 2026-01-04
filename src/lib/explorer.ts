export type AddressSummary = { balance_sats: number; tx_count: number }

export function getExplorerBase(): string {
  return process.env.EXPLORER_BASE_URL || 'https://mempool.space'
}

interface ExplorerAddressResponse {
  chain_stats?: {
    funded_txo_sum?: number;
    spent_txo_sum?: number;
    tx_count?: number;
  };
  mempool_stats?: {
    funded_txo_sum?: number;
    spent_txo_sum?: number;
    tx_count?: number;
  };
}

export async function fetchAddressSummary(address: string): Promise<AddressSummary | null> {
  try {
    const base = getExplorerBase()
    // Use RequestCache type from fetch API
    const res = await fetch(`${base}/api/address/${address}`, { 
      cache: 'no-store' as RequestCache 
    })
    if (!res.ok) {
      return null
    }
    const data = (await res.json()) as ExplorerAddressResponse
    const chain = data.chain_stats || {}
    const balance = (chain.funded_txo_sum || 0) - (chain.spent_txo_sum || 0)
    const txs = chain.tx_count || 0
    return { balance_sats: balance, tx_count: txs }
  } catch {
    return null
  }
}
