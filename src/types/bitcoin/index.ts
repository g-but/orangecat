export interface BitcoinTransaction {
  txid: string;
  value: number;
  status: 'confirmed' | 'pending';
  timestamp: number;
  type: 'incoming' | 'outgoing';
}

export interface BitcoinWalletData {
  balance: number;
  address: string;
  transactions: BitcoinTransaction[];
  network: 'mainnet' | 'testnet';
  lastUpdated?: string;
}
