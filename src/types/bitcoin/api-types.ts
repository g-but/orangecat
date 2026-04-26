/**
 * Raw Bitcoin API Response Types
 *
 * Shapes returned by mempool.space and blockstream.info — used as input
 * to the bitcoin service's `processBalance` / `processTransactions`
 * adapters that translate them into the UI-facing `BitcoinTransaction`
 * shape exported from this directory's `index.ts`.
 */

interface AddressStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

interface ScriptPubKey {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address?: string;
  value: number;
}

interface TxInput {
  txid: string;
  vout: number;
  prevout?: ScriptPubKey;
  scriptsig: string;
  scriptsig_asm: string;
  witness?: string[];
  is_coinbase: boolean;
  sequence: number;
}

interface TxOutput {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address?: string;
  value: number;
}

interface TxStatus {
  confirmed: boolean;
  block_height?: number;
  block_hash?: string;
  block_time?: number;
}

export interface MempoolAddressInfo {
  address: string;
  chain_stats: AddressStats;
  mempool_stats: AddressStats;
}

export interface MempoolTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: TxInput[];
  vout: TxOutput[];
  size: number;
  weight: number;
  fee: number;
  status: TxStatus;
}

export interface BlockstreamAddressInfo {
  address: string;
  chain_stats: AddressStats;
  mempool_stats: AddressStats;
}

export interface BlockstreamTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: TxInput[];
  vout: TxOutput[];
  size: number;
  weight: number;
  fee: number;
  status: TxStatus;
}
