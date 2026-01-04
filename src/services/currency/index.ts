/**
 * CURRENCY SERVICE
 *
 * Handles currency conversions between fiat and Bitcoin.
 * All transactions are stored in satoshis, but users can input/view in their local currency.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-12-04
 * Last Modified Summary: Initial currency service
 */

import {
  Currency,
  FiatCurrency,
  CryptoCurrency,
  CurrencyRate,
  CURRENCY_INFO,
  FIAT_CURRENCIES,
} from '@/types/settings';

// ==================== RATE CACHE ====================

interface RateCache {
  rates: Record<string, number>;
  lastUpdated: Date | null;
  expiresAt: Date | null;
}

const cache: RateCache = {
  rates: {
    // Default rates (will be updated from API)
    BTC_USD: 97000,
    BTC_EUR: 91000,
    BTC_CHF: 86000,
    BTC_GBP: 78000,
    BTC_SATS: 100000000, // Fixed: 1 BTC = 100M sats
  },
  lastUpdated: null,
  expiresAt: null,
};

// ==================== CORE CONVERSION FUNCTIONS ====================

/**
 * Convert satoshis to BTC
 */
export function satsToBtc(sats: number): number {
  return sats / 100_000_000;
}

/**
 * Convert BTC to satoshis
 */
export function btcToSats(btc: number): number {
  return Math.round(btc * 100_000_000);
}

/**
 * Convert satoshis to fiat currency
 */
export function satsToFiat(sats: number, currency: FiatCurrency): number {
  const btc = satsToBtc(sats);
  const rate = cache.rates[`BTC_${currency}`] || 0;
  return btc * rate;
}

/**
 * Convert fiat currency to satoshis
 */
export function fiatToSats(amount: number, currency: FiatCurrency): number {
  const rate = cache.rates[`BTC_${currency}`] || 1;
  const btc = amount / rate;
  return btcToSats(btc);
}

/**
 * Convert satoshis to any currency
 */
export function convertFromSats(sats: number, toCurrency: Currency): number {
  if (toCurrency === 'SATS') {
    return sats;
  }
  if (toCurrency === 'BTC') {
    return satsToBtc(sats);
  }
  return satsToFiat(sats, toCurrency as FiatCurrency);
}

/**
 * Convert any currency to satoshis
 */
export function convertToSats(amount: number, fromCurrency: Currency): number {
  if (fromCurrency === 'SATS') {
    return Math.round(amount);
  }
  if (fromCurrency === 'BTC') {
    return btcToSats(amount);
  }
  return fiatToSats(amount, fromCurrency as FiatCurrency);
}

/**
 * Convert between any two currencies (via sats)
 */
export function convert(amount: number, fromCurrency: Currency, toCurrency: Currency): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  const sats = convertToSats(amount, fromCurrency);
  return convertFromSats(sats, toCurrency);
}

// ==================== FORMATTING ====================

/**
 * Format amount in specified currency
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  options: {
    showSymbol?: boolean;
    compact?: boolean;
    locale?: string;
  } = {}
): string {
  const { showSymbol = true, compact = false, locale = 'en-US' } = options;
  const info = CURRENCY_INFO[currency];

  if (currency === 'SATS') {
    const formatted =
      compact && amount >= 1000000
        ? `${(amount / 1000000).toFixed(1)}M`
        : amount.toLocaleString(locale, { maximumFractionDigits: 0 });
    return showSymbol ? `${formatted} sats` : formatted;
  }

  if (currency === 'BTC') {
    const formatted = amount.toFixed(8).replace(/\.?0+$/, '');
    return showSymbol ? `₿${formatted}` : formatted;
  }

  // Fiat currencies
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: 2,
  });

  if (!showSymbol) {
    return formatted;
  }

  // Use proper currency formatting
  switch (currency) {
    case 'USD':
      return `$${formatted}`;
    case 'EUR':
      return `€${formatted}`;
    case 'GBP':
      return `£${formatted}`;
    case 'CHF':
      return `CHF ${formatted}`;
    default:
      return `${formatted} ${currency}`;
  }
}

/**
 * Format satoshis with automatic BTC conversion for large amounts
 */
export function formatSatsAuto(sats: number, locale: string = 'en-US'): string {
  if (sats >= 100_000_000) {
    // >= 1 BTC: show in BTC
    return formatCurrency(satsToBtc(sats), 'BTC', { locale });
  }
  if (sats >= 1_000_000) {
    // >= 1M sats: show in millions
    return `${(sats / 1_000_000).toFixed(1)}M sats`;
  }
  if (sats >= 1_000) {
    // >= 1k sats: show in thousands
    return `${(sats / 1_000).toFixed(1)}k sats`;
  }
  return `${sats.toLocaleString(locale)} sats`;
}

// ==================== MULTI-CURRENCY DISPLAY ====================

export interface CurrencyBreakdown {
  sats: number;
  btc: number;
  fiat: Record<FiatCurrency, number>;
}

/**
 * Get breakdown of amount in all currencies
 */
export function getCurrencyBreakdown(sats: number): CurrencyBreakdown {
  return {
    sats,
    btc: satsToBtc(sats),
    fiat: FIAT_CURRENCIES.reduce(
      (acc, currency) => {
        acc[currency] = satsToFiat(sats, currency);
        return acc;
      },
      {} as Record<FiatCurrency, number>
    ),
  };
}

// ==================== RATE MANAGEMENT ====================

/**
 * Update cached rates
 */
export function updateRates(rates: Record<string, number>): void {
  Object.assign(cache.rates, rates);
  cache.lastUpdated = new Date();
  cache.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
}

/**
 * Get current rate for a currency pair
 */
export function getRate(from: Currency, to: Currency): number {
  if (from === to) {
    return 1;
  }

  const key = `${from}_${to}`;
  if (cache.rates[key]) {
    return cache.rates[key];
  }

  // Try reverse rate
  const reverseKey = `${to}_${from}`;
  if (cache.rates[reverseKey]) {
    return 1 / cache.rates[reverseKey];
  }

  // Go through BTC
  const toBtcKey = `BTC_${from}`;
  const fromBtcKey = `BTC_${to}`;

  if (from === 'BTC' && cache.rates[fromBtcKey]) {
    return cache.rates[fromBtcKey];
  }
  if (to === 'BTC' && cache.rates[toBtcKey]) {
    return 1 / cache.rates[toBtcKey];
  }

  // Convert via BTC
  if (cache.rates[toBtcKey] && cache.rates[fromBtcKey]) {
    return cache.rates[fromBtcKey] / cache.rates[toBtcKey];
  }

  return 0;
}

/**
 * Fetch latest rates from API (to be called periodically)
 */
export async function fetchRates(): Promise<void> {
  try {
    const response = await fetch('/api/currency/rates');
    if (response.ok) {
      const data = await response.json();
      if (data.rates) {
        updateRates(data.rates);
      }
    }
  } catch (error) {
    console.error('Failed to fetch currency rates:', error);
  }
}

/**
 * Check if rates are stale and need refresh
 */
export function ratesNeedRefresh(): boolean {
  if (!cache.expiresAt) {
    return true;
  }
  return new Date() > cache.expiresAt;
}

// ==================== INPUT HELPERS ====================

/**
 * Parse user input to number, handling locale-specific formatting
 */
export function parseAmount(input: string, locale: string = 'en-US'): number | null {
  if (!input || input.trim() === '') {
    return null;
  }

  // Remove currency symbols and whitespace
  let cleaned = input.replace(/[^0-9.,\-]/g, '').trim();

  // Handle European format (1.234,56) vs US format (1,234.56)
  const hasCommaDecimal =
    cleaned.includes(',') &&
    (cleaned.indexOf(',') > cleaned.lastIndexOf('.') || !cleaned.includes('.'));

  if (hasCommaDecimal) {
    // European format: swap comma and period
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: remove thousands separators
    cleaned = cleaned.replace(/,/g, '');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Validate that an amount is reasonable for the given currency
 */
export function validateAmount(
  amount: number,
  currency: Currency
): { valid: boolean; error?: string } {
  if (amount < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }

  if (currency === 'SATS') {
    if (!Number.isInteger(amount)) {
      return { valid: false, error: 'Satoshis must be a whole number' };
    }
    if (amount > 21_000_000 * 100_000_000) {
      return { valid: false, error: 'Amount exceeds maximum Bitcoin supply' };
    }
  }

  if (currency === 'BTC') {
    if (amount > 21_000_000) {
      return { valid: false, error: 'Amount exceeds maximum Bitcoin supply' };
    }
  }

  return { valid: true };
}

// Export default service
export const currencyService = {
  satsToBtc,
  btcToSats,
  satsToFiat,
  fiatToSats,
  convert,
  convertFromSats,
  convertToSats,
  formatCurrency,
  formatSatsAuto,
  getCurrencyBreakdown,
  getRate,
  updateRates,
  fetchRates,
  ratesNeedRefresh,
  parseAmount,
  validateAmount,
};

export default currencyService;



