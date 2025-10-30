/**
 * Centralized Currency Converter Service
 * Single source of truth for all BTC/fiat conversions across the platform
 *
 * Features:
 * - Fetches live BTC prices from CoinGecko API
 * - Caches rates for performance
 * - Handles all currency conversions (BTC, SATS, CHF, USD, EUR)
 * - Provides reactive updates when BTC price changes
 */

import { logger } from '@/utils/logger';

export type CurrencyCode = 'BTC' | 'SATS' | 'CHF' | 'USD' | 'EUR';

export interface ExchangeRates {
  btcToChf: number;
  btcToUsd: number;
  btcToEur: number;
  lastUpdated: number;
}

class CurrencyConverterService {
  private rates: ExchangeRates | null = null;
  private cacheDuration = 60 * 1000; // 1 minute cache
  private fetchPromise: Promise<ExchangeRates> | null = null;

  /**
   * Fetch live BTC prices from CoinGecko
   */
  private async fetchRates(): Promise<ExchangeRates> {
    // If already fetching, return the same promise
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      try {
        // Use CoinGecko free API
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=chf,usd,eur',
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();
        const bitcoin = data.bitcoin;

        const rates: ExchangeRates = {
          btcToChf: bitcoin.chf || 95550, // Fallback to reasonable default
          btcToUsd: bitcoin.usd || 105000,
          btcToEur: bitcoin.eur || 96500,
          lastUpdated: Date.now(),
        };

        this.rates = rates;
        return rates;
      } catch (error) {
        logger.warn('Failed to fetch BTC prices, using fallback rates', error, 'Currency');

        // Fallback to hardcoded rates if API fails
        const fallbackRates: ExchangeRates = {
          btcToChf: 95550,
          btcToUsd: 105000,
          btcToEur: 96500,
          lastUpdated: Date.now(),
        };

        this.rates = fallbackRates;
        return fallbackRates;
      } finally {
        // Clear fetch promise after completion
        setTimeout(() => {
          this.fetchPromise = null;
        }, 1000);
      }
    })();

    return this.fetchPromise;
  }

  /**
   * Get current exchange rates (cached)
   */
  async getRates(): Promise<ExchangeRates> {
    // Return cached rates if still valid
    if (this.rates && Date.now() - this.rates.lastUpdated < this.cacheDuration) {
      return this.rates;
    }

    // Fetch new rates
    return this.fetchRates();
  }

  /**
   * Convert any currency to BTC
   */
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

  /**
   * Convert BTC to any currency
   */
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

  /**
   * Convert between any two currencies
   */
  async convert(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<number> {
    if (amount === 0) {
      return 0;
    }
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Convert to BTC first, then to target currency
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

  /**
   * Format currency amount with symbol
   */
  formatCurrency(amount: number, currency: CurrencyCode): string {
    const symbol =
      {
        CHF: 'CHF',
        USD: '$',
        EUR: '€',
        BTC: 'BTC',
        SATS: 'sats',
      }[currency.toUpperCase() as CurrencyCode] || currency;

    if (currency === 'BTC' || currency === 'SATS') {
      return this.formatBTC(amount, currency === 'BTC');
    }

    return `${symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.rates = null;
    this.fetchPromise = null;
  }
}

// Export singleton instance
export const currencyConverter = new CurrencyConverterService();

// Export convenience functions
export async function convertToBTC(amount: number, fromCurrency: CurrencyCode): Promise<number> {
  return currencyConverter.toBTC(amount, fromCurrency);
}

export async function convertFromBTC(amountBTC: number, toCurrency: CurrencyCode): Promise<number> {
  return currencyConverter.fromBTC(amountBTC, toCurrency);
}

export async function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<number> {
  return currencyConverter.convert(amount, fromCurrency, toCurrency);
}
