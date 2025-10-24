import { logger } from '@/utils/logger'
/**
 * Mempool API Service
 * Fetches Bitcoin address balance and transaction data from mempool.space
 */

const MEMPOOL_API = 'https://mempool.space/api'

export interface MempoolTransaction {
  txid: string
  version: number
  locktime: number
  size: number
  weight: number
  fee: number
  vin: Array<{
    txid: string
    vout: number
    prevout: {
      scriptpubkey: string
      scriptpubkey_asm: string
      scriptpubkey_type: string
      scriptpubkey_address: string
      value: number
    }
    scriptsig: string
    scriptsig_asm: string
    is_coinbase: boolean
    sequence: number
  }>
  vout: Array<{
    scriptpubkey: string
    scriptpubkey_asm: string
    scriptpubkey_type: string
    scriptpubkey_address: string
    value: number
  }>
  status: {
    confirmed: boolean
    block_height?: number
    block_hash?: string
    block_time?: number
  }
}

export interface AddressStats {
  address: string
  chain_stats: {
    funded_txo_count: number
    funded_txo_sum: number
    spent_txo_count: number
    spent_txo_sum: number
    tx_count: number
  }
  mempool_stats: {
    funded_txo_count: number
    funded_txo_sum: number
    spent_txo_count: number
    spent_txo_sum: number
    tx_count: number
  }
}

export interface TransactionSummary {
  txid: string
  timestamp: number | null
  confirmed: boolean
  amount: number // in sats, positive for incoming, negative for outgoing
  type: 'received' | 'sent'
  blockHeight?: number
}

/**
 * Get address statistics including balance
 */
export async function getAddressStats(address: string): Promise<AddressStats | null> {
  try {
    const response = await fetch(`${MEMPOOL_API}/address/${address}`, {
      cache: 'no-store', // Always get fresh data
    })

    if (!response.ok) {
      logger.error(`Mempool API error: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    logger.error('Failed to fetch address stats:', error)
    return null
  }
}

/**
 * Get address balance in satoshis
 */
export async function getAddressBalance(address: string): Promise<number | null> {
  const stats = await getAddressStats(address)
  if (!stats) return null

  const chainBalance = stats.chain_stats.funded_txo_sum - stats.chain_stats.spent_txo_sum
  const mempoolBalance = stats.mempool_stats.funded_txo_sum - stats.mempool_stats.spent_txo_sum

  return chainBalance + mempoolBalance
}

/**
 * Get recent transactions for an address
 */
export async function getAddressTransactions(
  address: string,
  limit: number = 10
): Promise<MempoolTransaction[]> {
  try {
    const response = await fetch(`${MEMPOOL_API}/address/${address}/txs`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      logger.error(`Mempool API error: ${response.status}`)
      return []
    }

    const txs: MempoolTransaction[] = await response.json()
    return txs.slice(0, limit)
  } catch (error) {
    logger.error('Failed to fetch transactions:', error)
    return []
  }
}

/**
 * Process transactions to show incoming/outgoing amounts for a specific address
 */
export function processTransactions(
  transactions: MempoolTransaction[],
  address: string
): TransactionSummary[] {
  return transactions.map((tx) => {
    let amount = 0
    let type: 'received' | 'sent' = 'received'

    // Calculate received amount (outputs to this address)
    const received = tx.vout
      .filter((vout) => vout.scriptpubkey_address === address)
      .reduce((sum, vout) => sum + vout.value, 0)

    // Calculate sent amount (inputs from this address)
    const sent = tx.vin
      .filter((vin) => vin.prevout?.scriptpubkey_address === address)
      .reduce((sum, vin) => sum + (vin.prevout?.value || 0), 0)

    // Determine net amount and type
    if (received > sent) {
      amount = received - sent
      type = 'received'
    } else if (sent > received) {
      amount = sent - received
      type = 'sent'
    } else {
      // Equal amounts (rare case, like sending to self)
      amount = received
      type = 'received'
    }

    return {
      txid: tx.txid,
      timestamp: tx.status.block_time || null,
      confirmed: tx.status.confirmed,
      amount,
      type,
      blockHeight: tx.status.block_height,
    }
  })
}

/**
 * Format satoshis to BTC
 */
export function formatBTC(sats: number, decimals: number = 8): string {
  return (sats / 100000000).toFixed(decimals)
}

/**
 * Format satoshis with appropriate units
 */
export function formatSats(sats: number): string {
  if (sats >= 100000000) {
    // 1+ BTC
    return `${formatBTC(sats, 4)} BTC`
  } else if (sats >= 1000000) {
    // 0.01+ BTC (show as BTC)
    return `${formatBTC(sats, 6)} BTC`
  } else if (sats >= 1000) {
    // Show in thousands of sats
    return `${(sats / 1000).toFixed(2)}k sats`
  } else {
    // Show in sats
    return `${sats} sats`
  }
}

/**
 * Get transaction explorer URL
 */
export function getTxUrl(txid: string): string {
  return `https://mempool.space/tx/${txid}`
}

/**
 * Get address explorer URL
 */
export function getAddressUrl(address: string): string {
  return `https://mempool.space/address/${address}`
}
