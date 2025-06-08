/**
 * Bitcoin Types - Proper TypeScript Definitions
 * 
 * Replaces 'any' types in Bitcoin services with proper type definitions
 * for API responses from mempool.space and blockstream.info
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Initial creation of Bitcoin API types for TypeScript cleanup
 */

// ==================== BITCOIN API RESPONSES ====================

/**
 * Raw Bitcoin address info from mempool.space
 * Replaces: data: any in processBalance
 */
export interface MempoolAddressInfo {
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

/**
 * Raw Bitcoin transaction from mempool.space
 * Replaces: any[] in processTransactions
 */
export interface MempoolTransaction {
  txid: string
  version: number
  locktime: number
  vin: MempoolInput[]
  vout: MempoolOutput[]
  size: number
  weight: number
  fee: number
  status: {
    confirmed: boolean
    block_height?: number
    block_hash?: string
    block_time?: number
  }
}

/**
 * Transaction input from mempool.space
 */
export interface MempoolInput {
  txid: string
  vout: number
  prevout?: {
    scriptpubkey: string
    scriptpubkey_asm: string
    scriptpubkey_type: string
    scriptpubkey_address?: string
    value: number
  }
  scriptsig: string
  scriptsig_asm: string
  witness?: string[]
  is_coinbase: boolean
  sequence: number
}

/**
 * Transaction output from mempool.space
 */
export interface MempoolOutput {
  scriptpubkey: string
  scriptpubkey_asm: string
  scriptpubkey_type: string
  scriptpubkey_address?: string
  value: number
}

/**
 * Raw Bitcoin address info from blockstream.info
 * Replaces: data: any in processBalance for blockstream
 */
export interface BlockstreamAddressInfo {
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

/**
 * Raw Bitcoin transaction from blockstream.info
 * Replaces: any[] in processTransactions for blockstream
 */
export interface BlockstreamTransaction {
  txid: string
  version: number
  locktime: number
  vin: BlockstreamInput[]
  vout: BlockstreamOutput[]
  size: number
  weight: number
  fee: number
  status: {
    confirmed: boolean
    block_height?: number
    block_hash?: string
    block_time?: number
  }
}

/**
 * Transaction input from blockstream.info
 */
export interface BlockstreamInput {
  txid: string
  vout: number
  prevout?: {
    scriptpubkey: string
    scriptpubkey_asm: string
    scriptpubkey_type: string
    scriptpubkey_address?: string
    value: number
  }
  scriptsig: string
  scriptsig_asm: string
  witness?: string[]
  is_coinbase: boolean
  sequence: number
}

/**
 * Transaction output from blockstream.info
 */
export interface BlockstreamOutput {
  scriptpubkey: string
  scriptpubkey_asm: string
  scriptpubkey_type: string
  scriptpubkey_address?: string
  value: number
}

// ==================== BITCOIN SERVICE TYPES ====================

/**
 * Bitcoin API provider configuration
 * Replaces: any in provider definitions
 */
export interface BitcoinProvider {
  name: string
  baseUrl: string
  processBalance: (data: MempoolAddressInfo | BlockstreamAddressInfo) => number
  processTransactions: (
    data: MempoolTransaction[] | BlockstreamTransaction[], 
    address: string
  ) => BitcoinTransaction[]
}

/**
 * Processed Bitcoin transaction (our internal format)
 * Already exists in codebase, but included for completeness
 */
export interface BitcoinTransaction {
  txid: string
  type: 'incoming' | 'outgoing'
  amount: number
  confirmations: number
  timestamp: number
  fee?: number
}

// ==================== TYPE GUARDS ====================

/**
 * Type guard to check if data is mempool format
 */
export function isMempoolAddressInfo(data: unknown): data is MempoolAddressInfo {
  return (
    typeof data === 'object' &&
    data !== null &&
    'address' in data &&
    'chain_stats' in data &&
    'mempool_stats' in data
  )
}

/**
 * Type guard to check if data is blockstream format
 */
export function isBlockstreamAddressInfo(data: unknown): data is BlockstreamAddressInfo {
  return (
    typeof data === 'object' &&
    data !== null &&
    'address' in data &&
    'chain_stats' in data &&
    'mempool_stats' in data
  )
}

/**
 * Type guard for mempool transaction array
 */
export function isMempoolTransactionArray(data: unknown): data is MempoolTransaction[] {
  return (
    Array.isArray(data) &&
    data.every(item => 
      typeof item === 'object' &&
      item !== null &&
      'txid' in item &&
      'vin' in item &&
      'vout' in item
    )
  )
}

/**
 * Type guard for blockstream transaction array
 */
export function isBlockstreamTransactionArray(data: unknown): data is BlockstreamTransaction[] {
  return (
    Array.isArray(data) &&
    data.every(item => 
      typeof item === 'object' &&
      item !== null &&
      'txid' in item &&
      'vin' in item &&
      'vout' in item
    )
  )
}

export interface BitcoinWalletData {
  balance: number;
  address: string;
  transactions: BitcoinTransaction[];
  network: 'mainnet' | 'testnet';
  lastUpdated?: string;
} 