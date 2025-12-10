/**
 * Central currency source of truth for frontend + backend.
 * Keep this list in sync with DB CHECK constraints and service validators.
 */

export const CURRENCY_CODES = ['USD', 'EUR', 'CHF', 'BTC', 'SATS'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

export const CURRENCY_METADATA: Record<
  CurrencyCode,
  { label: string; symbol: string; precision: number }
> = {
  USD: { label: 'USD (US Dollar)', symbol: '$', precision: 2 },
  EUR: { label: 'EUR (Euro)', symbol: '€', precision: 2 },
  CHF: { label: 'CHF (Swiss Franc)', symbol: 'CHF', precision: 2 },
  BTC: { label: 'BTC (Bitcoin)', symbol: '₿', precision: 8 },
  SATS: { label: 'Satoshis (sats)', symbol: 'sats', precision: 0 },
};

export const currencySelectOptions = CURRENCY_CODES.map((code) => ({
  value: code,
  label: CURRENCY_METADATA[code].label,
}));

export function isSupportedCurrency(value: string | null | undefined): value is CurrencyCode {
  return !!value && (CURRENCY_CODES as readonly string[]).includes(value.toUpperCase());
}
















