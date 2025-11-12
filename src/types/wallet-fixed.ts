// Fixed wallet types with proper validation

import { validate as validateBitcoinAddress } from 'bitcoin-address-validation';
import bs58check from 'bs58check';

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

// Constants for validation
const MAX_LABEL_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const SATS_PER_BTC = 100_000_000;

export const WALLET_CATEGORIES: Record<WalletCategory, { label: string; icon: string; description: string }> = {
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

// Allowed emojis for icons (whitelist for security)
export const ALLOWED_CATEGORY_ICONS = ['💰', '🏠', '🍔', '💊', '🎓', '🚨', '🚗', '💡', '📦'] as const;

export interface Wallet {
  id: string;
  profile_id: string | null;
  project_id: string | null;
  user_id: string | null;

  label: string;
  description: string | null;

  address_or_xpub: string;
  wallet_type: WalletType;

  category: WalletCategory;
  category_icon: string;

  goal_amount: number | null;
  goal_currency: string | null;
  goal_deadline: string | null;

  balance_btc: number;
  balance_updated_at: string | null;

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

export interface ValidationResult {
  valid: boolean;
  error: string | null;
  type?: WalletType;
}

/**
 * Detect wallet type from address/xpub string
 */
export function detectWalletType(addressOrXpub: string): WalletType {
  const input = addressOrXpub.trim();

  // Check for xpub/ypub/zpub prefixes
  const xpubPrefixes = ['xpub', 'ypub', 'zpub', 'tpub', 'upub', 'vpub'];
  if (xpubPrefixes.some((prefix) => input.startsWith(prefix))) {
    return 'xpub';
  }

  return 'address';
}

/**
 * Validate Bitcoin address using proper checksum validation
 * Supports: P2PKH, P2SH, P2WPKH (bech32), P2TR (taproot)
 */
export function isValidBitcoinAddress(address: string, network: 'mainnet' | 'testnet' = 'mainnet'): boolean {
  try {
    return validateBitcoinAddress(address, network);
  } catch {
    return false;
  }
}

/**
 * Validate xpub/ypub/zpub with proper base58check verification
 */
export function isValidXpub(xpub: string): boolean {
  try {
    const validPrefixes = ['xpub', 'ypub', 'zpub', 'tpub', 'upub', 'vpub'];

    // Check prefix
    if (!validPrefixes.some((prefix) => xpub.startsWith(prefix))) {
      return false;
    }

    // Verify base58check encoding and checksum
    const decoded = bs58check.decode(xpub);

    // Extended public keys should be 78 bytes when decoded
    if (decoded.length !== 78) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Comprehensive validation for address or xpub
 */
export function validateAddressOrXpub(input: string, network: 'mainnet' | 'testnet' = 'mainnet'): ValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { valid: false, error: 'Address or xpub is required' };
  }

  const type = detectWalletType(trimmed);

  if (type === 'xpub') {
    if (!isValidXpub(trimmed)) {
      return {
        valid: false,
        error: 'Invalid xpub format or checksum. Please verify your extended public key.',
      };
    }
    return { valid: true, type: 'xpub', error: null };
  }

  // Validate Bitcoin address
  if (!isValidBitcoinAddress(trimmed, network)) {
    return {
      valid: false,
      error:
        'Invalid Bitcoin address format or checksum. Supported: Legacy (1...), SegWit (3... or bc1q...), Taproot (bc1p...)',
    };
  }

  return { valid: true, type: 'address', error: null };
}

/**
 * Validate wallet form data
 */
export function validateWalletFormData(data: WalletFormData): ValidationResult {
  // Validate label
  if (!data.label || !data.label.trim()) {
    return { valid: false, error: 'Wallet name is required' };
  }

  if (data.label.length > MAX_LABEL_LENGTH) {
    return { valid: false, error: `Wallet name must be ${MAX_LABEL_LENGTH} characters or less` };
  }

  // Validate description
  if (data.description && data.description.length > MAX_DESCRIPTION_LENGTH) {
    return { valid: false, error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` };
  }

  // Validate address/xpub
  const addressValidation = validateAddressOrXpub(data.address_or_xpub);
  if (!addressValidation.valid) {
    return addressValidation;
  }

  // Validate category
  if (!Object.keys(WALLET_CATEGORIES).includes(data.category)) {
    return { valid: false, error: 'Invalid category' };
  }

  // Validate category icon (whitelist for security)
  if (data.category_icon && !ALLOWED_CATEGORY_ICONS.includes(data.category_icon as any)) {
    return { valid: false, error: 'Invalid category icon' };
  }

  // Validate goal amount
  if (data.goal_amount !== undefined && data.goal_amount !== null) {
    if (data.goal_amount <= 0) {
      return { valid: false, error: 'Goal amount must be greater than 0' };
    }
    if (data.goal_amount > 1_000_000_000) {
      // 1 billion max
      return { valid: false, error: 'Goal amount too large' };
    }
  }

  // Validate goal currency
  const validCurrencies = ['USD', 'EUR', 'BTC', 'SATS', 'CHF'];
  if (data.goal_currency && !validCurrencies.includes(data.goal_currency)) {
    return { valid: false, error: 'Invalid goal currency' };
  }

  return { valid: true, error: null };
}

/**
 * Sanitize user input for safe storage
 */
export function sanitizeWalletInput(data: WalletFormData): WalletFormData {
  return {
    ...data,
    label: data.label.trim().slice(0, MAX_LABEL_LENGTH),
    description: data.description?.trim().slice(0, MAX_DESCRIPTION_LENGTH) || undefined,
    address_or_xpub: data.address_or_xpub.trim(),
    category_icon: ALLOWED_CATEGORY_ICONS.includes(data.category_icon as any)
      ? data.category_icon
      : WALLET_CATEGORIES[data.category].icon,
    goal_amount: data.goal_amount && data.goal_amount > 0 ? Math.min(data.goal_amount, 1_000_000_000) : undefined,
  };
}

/**
 * Convert satoshis to BTC
 */
export function satoshisToBTC(satoshis: number): number {
  return satoshis / SATS_PER_BTC;
}

/**
 * Convert BTC to satoshis
 */
export function btcToSatoshis(btc: number): number {
  return Math.round(btc * SATS_PER_BTC);
}

/**
 * Format BTC amount for display
 */
export function formatBTC(btc: number, decimals: number = 8): string {
  return btc.toFixed(decimals);
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.min((current / goal) * 100, 100);
}
