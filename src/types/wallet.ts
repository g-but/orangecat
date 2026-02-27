// Fixed wallet types with proper validation

import { validate as validateBitcoinAddress } from 'bitcoin-address-validation';
import bs58check from 'bs58check';

export type WalletType = 'address' | 'xpub';

export type WalletBehaviorType = 'general' | 'recurring_budget' | 'one_time_goal';

export type BudgetPeriod =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';

export type GoalStatus = 'active' | 'paused' | 'reached' | 'purchased' | 'cancelled' | 'archived';

export type WalletCategory =
  | 'general'
  | 'rent'
  | 'food'
  | 'medical'
  | 'education'
  | 'emergency'
  | 'transportation'
  | 'utilities'
  | 'projects'
  | 'legal'
  | 'entertainment'
  | 'custom';

// Constants for validation
import { MAX_LABEL_LENGTH, MAX_DESCRIPTION_LENGTH } from '@/lib/wallets/constants';
const SATS_PER_BTC = 100_000_000;

export const WALLET_CATEGORIES: Record<
  WalletCategory,
  { label: string; icon: string; description: string }
> = {
  general: {
    label: 'General',
    icon: '💰',
    description: 'General purpose funding',
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
  projects: {
    label: 'Projects & Initiatives',
    icon: '🚀',
    description: 'Fund specific projects or initiatives',
  },
  legal: {
    label: 'Legal & Advocacy',
    icon: '⚖️',
    description: 'Legal fees and advocacy work',
  },
  entertainment: {
    label: 'Entertainment & Arts',
    icon: '🎭',
    description: 'Arts, entertainment, and creative projects',
  },
  custom: {
    label: 'Other',
    icon: '📦',
    description: 'Custom category',
  },
};

// Allowed emojis for icons (whitelist for security)
export const ALLOWED_CATEGORY_ICONS = [
  '💰',
  '🏠',
  '🍔',
  '💊',
  '🎓',
  '🚨',
  '🚗',
  '💡',
  '🚀',
  '⚖️',
  '🎭',
  '📦',
] as const;

export interface Wallet {
  id: string;
  profile_id: string | null;
  project_id: string | null;
  user_id: string | null;

  label: string;
  description: string | null;

  address_or_xpub: string;
  wallet_type: WalletType;
  lightning_address: string | null;

  category: WalletCategory;
  category_icon: string;

  // Behavior type determines how this wallet works
  behavior_type: WalletBehaviorType;

  // For recurring budgets
  budget_amount: number | null;
  budget_currency: string | null;
  budget_period: BudgetPeriod | null;
  budget_period_start_day: number | null;
  budget_reset_day: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  current_period_spent: number | null;
  alert_threshold_percent: number | null;
  alert_sent_at: string | null;

  // For one-time goals (replaces old goal_* fields)
  goal_amount: number | null;
  goal_currency: string | null;
  goal_deadline: string | null;
  goal_status: GoalStatus | null;
  goal_reached_at: string | null;
  goal_purchased_at: string | null;
  purchase_notes: string | null;
  milestone_25_reached_at: string | null;
  milestone_50_reached_at: string | null;
  milestone_75_reached_at: string | null;
  milestone_100_reached_at: string | null;

  // Social features for goals
  is_public_goal: boolean;
  allow_contributions: boolean;
  contribution_count: number;

  // Balance tracking
  balance_btc: number;
  balance_updated_at: string | null;

  // Analytics
  last_transaction_at: string | null;
  transaction_count: number;
  total_received: number;
  total_spent: number;

  // Display settings
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
  is_used: boolean;
  first_tx_at: string | null;
  watch_status: 'active' | 'paused' | 'archived';
}

export interface BudgetPeriodRecord {
  id: string;
  wallet_id: string;
  period_start: string;
  period_end: string;
  period_type: BudgetPeriod;
  budget_amount: number;
  budget_currency: string;
  amount_spent: number;
  transaction_count: number;
  average_transaction: number | null;
  largest_transaction: number | null;
  status: 'active' | 'completed' | 'rolled_over' | 'cancelled';
  completion_rate: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface GoalMilestone {
  id: string;
  wallet_id: string;
  milestone_percent: number;
  milestone_amount: number;
  reached_at: string | null;
  was_celebrated: boolean;
  shared_publicly: boolean;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface WalletContribution {
  id: string;
  wallet_id: string;
  contributor_profile_id: string | null;
  contributor_name: string | null;
  is_anonymous: boolean;
  amount_btc: number;
  amount_usd: number | null;
  message: string | null;
  transaction_hash: string | null;
  confirmed_at: string | null;
  thanked: boolean;
  public_visibility: boolean;
  created_at: string;
}

export interface WalletFormData {
  label: string;
  description?: string;
  address_or_xpub: string;
  lightning_address?: string;
  category: WalletCategory;
  category_icon?: string;
  behavior_type: WalletBehaviorType;

  // For recurring budgets
  budget_amount?: number;
  budget_currency?: string;
  budget_period?: BudgetPeriod;
  alert_threshold_percent?: number;

  // For one-time goals
  goal_amount?: number;
  goal_currency?: string;
  goal_deadline?: string;
  is_public_goal?: boolean;
  allow_contributions?: boolean;

  is_primary?: boolean;
}

export interface RecurringBudgetFormData extends WalletFormData {
  behavior_type: 'recurring_budget';
  budget_amount: number;
  budget_currency: string;
  budget_period: BudgetPeriod;
}

export interface OneTimeGoalFormData extends WalletFormData {
  behavior_type: 'one_time_goal';
  goal_amount: number;
  goal_currency: string;
  goal_deadline?: string;
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
  if (xpubPrefixes.some(prefix => input.startsWith(prefix))) {
    return 'xpub';
  }

  return 'address';
}

/**
 * Validate Bitcoin address using proper checksum validation
 * Supports: P2PKH, P2SH, P2WPKH (bech32), P2TR (taproot)
 */
export function isValidBitcoinAddress(
  address: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return validateBitcoinAddress(address, network as any);
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
    if (!validPrefixes.some(prefix => xpub.startsWith(prefix))) {
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
export function validateAddressOrXpub(
  input: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): ValidationResult {
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
    return {
      valid: false,
      error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
    };
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
  // Type guard to check if string is in the allowed icons array
  if (
    data.category_icon &&
    !(ALLOWED_CATEGORY_ICONS as readonly string[]).includes(data.category_icon)
  ) {
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
    category_icon: (ALLOWED_CATEGORY_ICONS as readonly string[]).includes(data.category_icon || '')
      ? data.category_icon
      : WALLET_CATEGORIES[data.category].icon,
    goal_amount:
      data.goal_amount && data.goal_amount > 0
        ? Math.min(data.goal_amount, 1_000_000_000)
        : undefined,
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
  if (!goal || goal <= 0) {
    return 0;
  }
  return Math.min((current / goal) * 100, 100);
}

/**
 * Get wallet behavior display info
 */
export function getWalletBehaviorInfo(behaviorType: WalletBehaviorType): {
  label: string;
  description: string;
  icon: string;
} {
  switch (behaviorType) {
    case 'recurring_budget':
      return {
        label: 'Recurring Budget',
        description: 'For ongoing expenses that repeat monthly',
        icon: '🔄',
      };
    case 'one_time_goal':
      return {
        label: 'One-Time Savings Goal',
        description: 'For specific purchases or projects',
        icon: '🎯',
      };
    case 'general':
    default:
      return {
        label: 'General Wallet',
        description: 'No specific budget or goal',
        icon: '💰',
      };
  }
}

/**
 * Get budget period display info
 */
export function getBudgetPeriodInfo(period: BudgetPeriod): {
  label: string;
  description: string;
} {
  switch (period) {
    case 'daily':
      return { label: 'Daily', description: 'Resets every day' };
    case 'weekly':
      return { label: 'Weekly', description: 'Resets every week' };
    case 'biweekly':
      return { label: 'Bi-weekly', description: 'Resets every 2 weeks' };
    case 'monthly':
      return { label: 'Monthly', description: 'Resets every month' };
    case 'quarterly':
      return { label: 'Quarterly', description: 'Resets every 3 months' };
    case 'yearly':
      return { label: 'Yearly', description: 'Resets every year' };
    case 'custom':
    default:
      return { label: 'Custom', description: 'Custom period' };
  }
}

/**
 * Calculate days remaining in a period
 */
export function getDaysRemaining(endDate: string | Date): number {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculate daily amount needed to reach goal
 */
export function getDailyAmountNeeded(
  currentAmount: number,
  goalAmount: number,
  deadline: string | Date
): number | null {
  const daysLeft = getDaysRemaining(deadline);
  if (daysLeft <= 0 || goalAmount <= currentAmount) {
    return null;
  }
  const remaining = goalAmount - currentAmount;
  return remaining / daysLeft;
}

/**
 * Check if wallet is over budget
 */
export function isOverBudget(spent: number, budget: number): boolean {
  return spent > budget;
}

/**
 * Check if wallet reached alert threshold
 */
export function reachedAlertThreshold(
  spent: number,
  budget: number,
  threshold: number = 80
): boolean {
  if (budget <= 0) {
    return false;
  }
  const percentUsed = (spent / budget) * 100;
  return percentUsed >= threshold;
}

/**
 * Get goal status display info
 */
export function getGoalStatusInfo(status: GoalStatus): {
  label: string;
  color: string;
  description: string;
} {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        color: 'blue',
        description: 'Currently saving toward this goal',
      };
    case 'paused':
      return {
        label: 'Paused',
        color: 'gray',
        description: 'Temporarily paused',
      };
    case 'reached':
      return {
        label: 'Goal Reached',
        color: 'green',
        description: 'Target amount reached!',
      };
    case 'purchased':
      return {
        label: 'Purchased',
        color: 'purple',
        description: 'Goal completed and purchased',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'red',
        description: 'Goal was cancelled',
      };
    case 'archived':
      return {
        label: 'Archived',
        color: 'gray',
        description: 'Moved to archives',
      };
    default:
      return {
        label: 'Unknown',
        color: 'gray',
        description: 'Status unknown',
      };
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string): string {
  if (currency === 'BTC') {
    return `${formatBTC(amount)} BTC`;
  } else if (currency === 'SATS') {
    return `${Math.round(amount).toLocaleString()} sat`;
  } else {
    // Fiat currencies
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

/**
 * Check if a milestone has been reached
 */
export function checkMilestone(current: number, goal: number, milestonePercent: number): boolean {
  if (goal <= 0) {
    return false;
  }
  const progress = (current / goal) * 100;
  return progress >= milestonePercent;
}
