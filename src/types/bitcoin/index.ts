export interface BitcoinTransaction {
  txid: string;
  value: number;
  status: 'confirmed' | 'pending';
  timestamp: number;
  type: 'incoming' | 'outgoing';
}
export interface BitcoinWalletData {
  balance: number;
  transactions: BitcoinTransaction[];
  lastUpdated: number;
}
