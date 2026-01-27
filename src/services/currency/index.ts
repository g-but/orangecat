/**
 * CURRENCY SERVICE - SINGLE SOURCE OF TRUTH
 *
 * Handles currency conversions between fiat and Bitcoin.
 * BTC is the base currency for all transactions and calculations.
 * Users can input/view amounts in their preferred currency.
 *
 * This is the SSOT for all currency operations. Other currency files
 * (utils/currency.ts, services/currencyConverter.ts) re-export from here.
 *
 * Created: 2025-12-04
 * Last Modified: 2026-01-27
 * Last Modified Summary: Consolidated from 3 duplicate files into SSOT
 */

import { CURRENCY_METADATA, type CurrencyCode } from '@/config/currencies';
import { logger } from '@/utils/logger';

// ==================== TYPES ====================

export interface ExchangeRates {
  btcToChf: number;
  btcToUsd: number;
  btcToEur: number;
  lastUpdated: number;
}

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
  },
  lastUpdated: null,
  expiresAt: null,
};

// ==================== COINGECKO SERVICE ====================

/**
 * CurrencyConverterService class for async rate fetching
 * Used by useCurrencyConversion hook and server actions
 */
class CurrencyConverterService {
  private apiRates: ExchangeRates | null = null;
  private cacheDuration = 60 * 1000; // 1 minute cache
  private fetchPromise: Promise<ExchangeRates> | null = null;

  /**
   * Fetch live BTC prices from CoinGecko
   */
  private async fetchRatesFromApi(): Promise<ExchangeRates> {
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=chf,usd,eur',
          { headers: { Accept: 'application/json' } }
        );

        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();
        const bitcoin = data.bitcoin;

        const rates: ExchangeRates = {
          btcToChf: bitcoin.chf || 86000,
          btcToUsd: bitcoin.usd || 97000,
          btcToEur: bitcoin.eur || 91000,
          lastUpdated: Date.now(),
        };

        this.apiRates = rates;
        // Also update the cache for sync access
        updateRates({
          BTC_USD: rates.btcToUsd,
          BTC_EUR: rates.btcToEur,
          BTC_CHF: rates.btcToChf,
        });
        return rates;
      } catch (error) {
        logger.warn('Failed to fetch BTC prices, using fallback rates', error, 'Currency');

        const fallbackRates: ExchangeRates = {
          btcToChf: 86000,
          btcToUsd: 97000,
          btcToEur: 91000,
          lastUpdated: Date.now(),
        };

        this.apiRates = fallbackRates;
        return fallbackRates;
      } finally {
        setTimeout(() => {
          this.fetchPromise = null;
        }, 1000);
      }
    })();

    return this.fetchPromise;
  }

  async getRates(): Promise<ExchangeRates> {
    if (this.apiRates && Date.now() - this.apiRates.lastUpdated < this.cacheDuration) {
      return this.apiRates;
    }
    return this.fetchRatesFromApi();
  }

  getCachedRates(): ExchangeRates | null {
    return this.apiRates;
  }

  async toBTC(amount: number, fromCurrency: CurrencyCode): Promise<number> {
    if (amount === 0) {
      return 0;
    }
    const rates = await this.getRates();

    switch (fromCurrency.toUpperCase()) {
      case 'BTC':
        return amount;
      case 'SATS':
        return amount / 100_000_000;
      case 'CHF':
        return amount / rates.btcToChf;
      case 'USD':
        return amount / rates.btcToUsd;
      case 'EUR':
        return amount / rates.btcToEur;
      default:
        return 0;
    }
  }

  async fromBTC(amountBTC: number, toCurrency: CurrencyCode): Promise<number> {
    if (amountBTC === 0) {
      return 0;
    }
    const rates = await this.getRates();

    switch (toCurrency.toUpperCase()) {
      case 'BTC':
        return amountBTC;
      case 'SATS':
        return Math.round(amountBTC * 100_000_000);
      case 'CHF':
        return amountBTC * rates.btcToChf;
      case 'USD':
        return amountBTC * rates.btcToUsd;
      case 'EUR':
        return amountBTC * rates.btcToEur;
      default:
        return 0;
    }
  }

  async convert(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<number> {
    if (amount === 0 || fromCurrency === toCurrency) {
      return amount;
    }
    const btcAmount = await this.toBTC(amount, fromCurrency);
    return this.fromBTC(btcAmount, toCurrency);
  }

  /**
   * Format BTC amount for display
   */
  formatBTC(amountBTC: number, showDecimals = true): string {
    if (amountBTC === 0) {
      return '0 BTC';
    }
    if (amountBTC < 0.00001) {
      const sats = Math.round(amountBTC * 100_000_000);
      return `${sats.toLocaleString()} sats`;
    }
    if (showDecimals) {
      return `${amountBTC.toLocaleString(undefined, { maximumFractionDigits: 8 })} BTC`;
    }
    return `${amountBTC.toFixed(2)} BTC`;
  }

  clearCache(): void {
    this.apiRates = null;
    this.fetchPromise = null;
  }
}

// Singleton instance for async operations
export const currencyConverter = new CurrencyConverterService();

// Convenience async functions
export async function convertToBTC(amount: number, fromCurrency: CurrencyCode): Promise<number> {
  return currencyConverter.toBTC(amount, fromCurrency);
}

export async function convertFromBTC(amountBTC: number, toCurrency: CurrencyCode): Promise<number> {
  return currencyConverter.fromBTC(amountBTC, toCurrency);
}

export async function convertCurrencyAsync(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<number> {
  return currencyConverter.convert(amount, fromCurrency, toCurrency);
}

// ==================== CORE CONVERSION FUNCTIONS ====================

/**
 * Convert BTC to any display currency
 */
export function convertBtcTo(amount: number, targetCurrency: string): number {
  if (targetCurrency === 'BTC') {
    return amount;
  }

  if (targetCurrency === 'SATS') {
    return Math.round(amount * 100_000_000);
  }

  // Fiat currency conversion
  const rate = cache.rates[`BTC_${targetCurrency}`] || 0;
  return amount * rate;
}

/**
 * Convert any currency to BTC
 */
export function convertToBtc(amount: number, fromCurrency: string): number {
  if (fromCurrency === 'BTC') {
    return amount;
  }

  if (fromCurrency === 'SATS') {
    return amount / 100_000_000;
  }

  // Fiat currency conversion
  const rate = cache.rates[`BTC_${fromCurrency}`] || 1;
  return amount / rate;
}

/**
 * Convert between any two currencies (via BTC)
 */
export function convert(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  const btc = convertToBtc(amount, fromCurrency);
  return convertBtcTo(btc, toCurrency);
}

// ==================== FORMATTING ====================

/**
 * Format amount in specified currency
 */
export function formatCurrency(
  amount: number,
  currency: string,
  options: {
    showSymbol?: boolean;
    compact?: boolean;
    locale?: string;
  } = {}
): string {
  const { showSymbol = true, compact = false, locale = 'en-US' } = options;
  const metadata = CURRENCY_METADATA[currency as keyof typeof CURRENCY_METADATA];

  if (!metadata) {
    return amount.toLocaleString(locale);
  }

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
    minimumFractionDigits: compact ? 0 : metadata.precision,
    maximumFractionDigits: metadata.precision,
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

// ==================== MULTI-CURRENCY DISPLAY ====================

export interface CurrencyBreakdown {
  btc: number;
  sats: number;
  fiat: Record<string, number>;
}

/**
 * Get breakdown of BTC amount in all currencies
 */
export function getCurrencyBreakdown(btcAmount: number): CurrencyBreakdown {
  return {
    btc: btcAmount,
    sats: Math.round(btcAmount * 100_000_000),
    fiat: ['USD', 'EUR', 'CHF', 'GBP'].reduce(
      (acc, currency) => {
        acc[currency] = convertBtcTo(btcAmount, currency);
        return acc;
      },
      {} as Record<string, number>
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
export function getRate(from: string, to: string): number {
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
    logger.error(
      'Failed to fetch currency rates',
      { error: error instanceof Error ? error.message : error },
      'currency'
    );
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
export function parseAmount(input: string, _locale: string = 'en-US'): number | null {
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
  currency: string
): { valid: boolean; error?: string } {
  if (amount < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }

  if (currency === 'SATS') {
    if (!Number.isInteger(amount)) {
      return { valid: false, error: 'Sats must be a whole number' };
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

// ==================== BITCOIN SPECIFIC CONVERSIONS ====================

/**
 * Convert satoshis to BTC
 */
export function satsToBitcoin(sats: number): number {
  return sats / 100_000_000;
}

/**
 * Convert BTC to satoshis
 */
export function bitcoinToSats(bitcoin: number): number {
  return Math.round(bitcoin * 100_000_000);
}

// Aliases for common naming conventions
export const satsToBTC = satsToBitcoin;
export const satsToBtc = satsToBitcoin;
export const btcToSats = bitcoinToSats;
export const satoshisToBitcoin = satsToBitcoin;
export const bitcoinToSatoshis = bitcoinToSats;

// ==================== BITCOIN DISPLAY FORMATTING ====================

/**
 * Format Bitcoin amount for display
 */
export function formatBitcoinDisplay(amount: number, unit: 'BTC' | 'sats' = 'BTC'): string {
  if (unit === 'sats') {
    return `${amount.toLocaleString('en-US')} sats`;
  }

  if (amount >= 1) {
    return `${amount.toFixed(4)} BTC`;
  } else if (amount >= 0.001) {
    return `${amount.toFixed(6)} BTC`;
  } else {
    // For very small amounts, show in sats
    const sats = bitcoinToSats(amount);
    return `${sats.toLocaleString('en-US')} sats`;
  }
}

/**
 * Format amount in Swiss Francs
 */
export function formatSwissFrancs(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format BTC amount with exact 8 decimal places
 */
export function formatBTC(amount: number): string {
  const value = typeof amount === 'number' && isFinite(amount) ? amount : 0;
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  })} BTC`;
}

/**
 * Format amount in sats
 */
export function formatSats(amount: number): string {
  const value = typeof amount === 'number' && isFinite(amount) ? Math.round(amount) : 0;
  return `${value.toLocaleString('en-US')} sats`;
}

/**
 * Format amount in USD
 */
export function formatUSD(amount: number): string {
  const value = typeof amount === 'number' && isFinite(amount) ? amount : 0;
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ==================== CONVERSION RESULTS ====================

export interface CurrencyConversion {
  bitcoin: number;
  sats: number;
  chf: number;
  usd: number;
}

/**
 * Convert BTC amount to all common currencies
 */
export function convertBitcoinToAll(bitcoin: number): CurrencyConversion {
  const sats = bitcoinToSats(bitcoin);
  const chf = convertBtcTo(bitcoin, 'CHF');
  const usd = convertBtcTo(bitcoin, 'USD');

  return {
    bitcoin,
    sats,
    chf,
    usd,
  };
}

/**
 * Convert sats amount to all common currencies
 */
export function convertSatsToAll(sats: number): CurrencyConversion {
  const bitcoin = satsToBitcoin(sats);
  return convertBitcoinToAll(bitcoin);
}

// ==================== REGIONAL DISPLAY UTILITIES ====================

/**
 * Get region name for display
 */
export function getRegionName(): string {
  // For now, hardcoded to Switzerland
  // Later this will be dynamic based on user location
  return 'Switzerland';
}

/**
 * Get region emoji flag
 */
export function getRegionEmoji(): string {
  // For now, hardcoded to Swiss flag
  // Later this will be dynamic based on user location
  return '🇨🇭';
}

/**
 * Format regional alternatives text
 */
export function formatRegionalAlternatives(): string {
  return 'alternatives popular in your region';
}

// ==================== BITCOIN PRICE HOOK (placeholder) ====================

/**
 * Hook for real-time price data (placeholder for future implementation)
 */
export function useBitcoinPrice() {
  return {
    btcUsd: cache.rates['BTC_USD'] || 97000,
    btcChf: cache.rates['BTC_CHF'] || 86000,
    usdChf: 0.89,
    isLoading: false,
    error: null,
  };
}

// Export default service
export const currencyService = {
  convertBtcTo,
  convertToBtc,
  convert,
  formatCurrency,
  getCurrencyBreakdown,
  getRate,
  updateRates,
  fetchRates,
  ratesNeedRefresh,
  parseAmount,
  validateAmount,
  // Bitcoin specific
  satsToBitcoin,
  bitcoinToSats,
  formatBitcoinDisplay,
  formatSwissFrancs,
  formatBTC,
  formatSats,
  formatUSD,
  convertBitcoinToAll,
  convertSatsToAll,
  // Regional
  getRegionName,
  getRegionEmoji,
  formatRegionalAlternatives,
  useBitcoinPrice,
};

export default currencyService;
