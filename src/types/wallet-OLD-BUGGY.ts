// Wallet system types - works for both profiles and projects

export type WalletType = 'address' | 'xpub';

export type WalletCategory =
  | 'general'
  | 'rent'
  | 'food'
  | 'medical'
  | 'education'
  | 'emergency'
  | 'transportation'
  | 'utilities'
  | 'custom';

export const WALLET_CATEGORIES: Record<
  WalletCategory,
  { label: string; icon: string; description: string }
> = {
  general: {
    label: 'General',
    icon: '💰',
    description: 'General purpose donations',
  },
  rent: {
    label: 'Rent & Housing',
    icon: '🏠',
    description: 'Help cover housing costs',
  },
  food: {
    label: 'Food & Groceries',
    icon: '🍔',
    description: 'Support daily nutrition',
  },
  medical: {
    label: 'Medical & Healthcare',
    icon: '💊',
    description: 'Medical expenses and healthcare',
  },
  education: {
    label: 'Education',
    icon: '🎓',
    description: 'School fees and learning materials',
  },
  emergency: {
    label: 'Emergency Fund',
    icon: '🚨',
    description: 'Urgent unexpected expenses',
  },
  transportation: {
    label: 'Transportation',
    icon: '🚗',
    description: 'Travel and commute costs',
  },
  utilities: {
    label: 'Utilities',
    icon: '💡',
    description: 'Power, water, internet bills',
  },
  custom: {
    label: 'Other',
    icon: '📦',
    description: 'Custom category',
  },
};

export interface Wallet {
  id: string;
  profile_id: string | null;
  project_id: string | null;

  // Wallet info
  label: string;
  description: string | null;

  // Bitcoin
  address_or_xpub: string;
  wallet_type: WalletType;

  // Category
  category: WalletCategory;
  category_icon: string;

  // Optional goal
  goal_amount: number | null;
  goal_currency: string | null;
  goal_deadline: string | null;

  // Balance
  balance_btc: number;
  balance_updated_at: string | null;

  // Display
  is_active: boolean;
  display_order: number;
  is_primary: boolean;

  created_at: string;
  updated_at: string;
}

export interface WalletAddress {
  id: string;
  wallet_id: string;
  address: string;
  derivation_index: number;
  balance_btc: number;
  tx_count: number;
  last_tx_at: string | null;
  discovered_at: string;
}

// Form data for creating/editing wallets
export interface WalletFormData {
  label: string;
  description?: string;
  address_or_xpub: string;
  category: WalletCategory;
  category_icon?: string;
  goal_amount?: number;
  goal_currency?: string;
  goal_deadline?: string;
  is_primary?: boolean;
}

// Helper to detect wallet type from address/xpub string
export function detectWalletType(addressOrXpub: string): WalletType {
  const input = addressOrXpub.trim();

  // Check for xpub/ypub/zpub
  if (
    input.startsWith('xpub') ||
    input.startsWith('ypub') ||
    input.startsWith('zpub') ||
    input.startsWith('tpub') || // testnet
    input.startsWith('upub') || // testnet
    input.startsWith('vpub') // testnet
  ) {
    return 'xpub';
  }

  // Otherwise assume it's an address
  return 'address';
}

// Validate Bitcoin address format (basic)
export function isValidBitcoinAddress(address: string): boolean {
  const patterns = {
    // Legacy P2PKH
    legacy: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    // SegWit P2SH
    segwit: /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    // Native SegWit (Bech32)
    bech32: /^(bc1|tb1)[a-z0-9]{39,87}$/i,
  };

  return Object.values(patterns).some(pattern => pattern.test(address));
}

// Validate xpub format (basic)
export function isValidXpub(xpub: string): boolean {
  const prefixes = ['xpub', 'ypub', 'zpub', 'tpub', 'upub', 'vpub'];
  return prefixes.some(prefix => xpub.startsWith(prefix)) && xpub.length > 100;
}

// Validate address or xpub
export function validateAddressOrXpub(input: string): {
  valid: boolean;
  type: WalletType | null;
  error: string | null;
} {
  const trimmed = input.trim();

  if (!trimmed) {
    return { valid: false, type: null, error: 'Address or xpub is required' };
  }

  const type = detectWalletType(trimmed);

  if (type === 'xpub') {
    if (!isValidXpub(trimmed)) {
      return { valid: false, type: null, error: 'Invalid xpub format' };
    }
    return { valid: true, type: 'xpub', error: null };
  }

  if (type === 'address') {
    if (!isValidBitcoinAddress(trimmed)) {
      return { valid: false, type: null, error: 'Invalid Bitcoin address format' };
    }
    return { valid: true, type: 'address', error: null };
  }

  return { valid: false, type: null, error: 'Unknown format' };
}
