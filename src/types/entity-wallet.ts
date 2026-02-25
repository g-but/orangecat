import type { Wallet } from './wallet';

export interface EntityWallet {
  id: string;
  wallet_id: string;
  entity_type: string;
  entity_id: string;
  is_primary: boolean;
  created_at: string;
  created_by: string | null;
  /** Joined wallet data (when fetched with select('*, wallet:wallets(*)')) */
  wallet?: Wallet;
}
