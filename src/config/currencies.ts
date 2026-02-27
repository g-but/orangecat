/**
 * SINGLE SOURCE OF TRUTH FOR CURRENCY
 *
 * This file is the ONLY place where currency codes are defined.
 * All database constraints, validation schemas, and UI components MUST use these values.
 *
 * IMPORTANT:
 * - All transactions are stored and settled in BTC (satoshis)
 * - Currency is ONLY for display and input purposes
 * - Users can set their preferred currency in settings (stored in profiles.currency)
 * - Default currency is CHF (Swiss-focused platform)
 * - When a user changes their currency preference, that becomes their default
 *
 * Database migrations MUST reference these values - do NOT hardcode currency lists.
 *
 * Created: 2025-01-03
 * Last Modified: 2026-01-05
 * Last Modified Summary: Established as SSOT with clear documentation about BTC-only transactions
 */

export const CURRENCY_CODES = ['USD', 'EUR', 'CHF', 'BTC', 'SATS'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

/**
 * Platform default currency (Swiss-focused)
 * Used when user hasn't set a preference yet.
 * Users can change this in their settings.
 */
export const PLATFORM_DEFAULT_CURRENCY: CurrencyCode = 'CHF';

/** Legacy default - kept for backward compatibility, prefer PLATFORM_DEFAULT_CURRENCY */
export const DEFAULT_CURRENCY: CurrencyCode = PLATFORM_DEFAULT_CURRENCY;

export const CURRENCY_METADATA: Record<
  CurrencyCode,
  { label: string; symbol: string; precision: number }
> = {
  USD: { label: 'USD (US Dollar)', symbol: '$', precision: 2 },
  EUR: { label: 'EUR (Euro)', symbol: '€', precision: 2 },
  CHF: { label: 'CHF (Swiss Franc)', symbol: 'CHF', precision: 2 },
  BTC: { label: 'BTC (Bitcoin)', symbol: '₿', precision: 8 },
  SATS: { label: 'Satoshis', symbol: 'sat', precision: 0 },
};

export const currencySelectOptions = CURRENCY_CODES.map(code => ({
  value: code,
  label: CURRENCY_METADATA[code].label,
}));

export function isSupportedCurrency(value: string | null | undefined): value is CurrencyCode {
  return !!value && (CURRENCY_CODES as readonly string[]).includes(value.toUpperCase());
}
