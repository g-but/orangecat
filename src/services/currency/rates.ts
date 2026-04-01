/**
 * Currency Rate Management
 *
 * Handles rate caching, fetching from CoinGecko, and rate lookups.
 */

import type { CurrencyCode } from '@/config/currencies';
import { logger } from '@/utils/logger';
import type { ExchangeRates, RateCache } from './types';

// ==================== RATE CACHE ====================

export const cache: RateCache = {
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

// ==================== RATE MANAGEMENT ====================

export function updateRates(rates: Record<string, number>): void {
  Object.assign(cache.rates, rates);
  cache.lastUpdated = new Date();
  cache.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
}

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

export function ratesNeedRefresh(): boolean {
  if (!cache.expiresAt) {
    return true;
  }
  return new Date() > cache.expiresAt;
}

// ==================== COINGECKO CONVERTER SERVICE ====================

class CurrencyConverterService {
  private apiRates: ExchangeRates | null = null;
  private cacheDuration = 60 * 1000; // 1 minute cache
  private fetchPromise: Promise<ExchangeRates> | null = null;

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

  formatBTC(amountBTC: number, showDecimals = true): string {
    if (amountBTC === 0) {
      return '0 BTC';
    }
    if (amountBTC < 0.00001) {
      const sats = Math.round(amountBTC * 100_000_000);
      return `${sats.toLocaleString()} sat`;
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

// Singleton instance
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

// Placeholder hook for real-time price data
export function useBitcoinPrice() {
  return {
    btcUsd: cache.rates['BTC_USD'] || 97000,
    btcChf: cache.rates['BTC_CHF'] || 86000,
    usdChf: 0.89,
    isLoading: false,
    error: null,
  };
}
