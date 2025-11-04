/**
 * useCurrencyConversion Hook
 *
 * React hook wrapper for the centralized currency converter service.
 * Provides synchronous conversion using cached rates.
 *
 * Single source of truth: /src/services/currencyConverter.ts
 *
 * Created: 2025-06-05
 */

import { useState, useEffect } from 'react';
import { currencyConverter, CurrencyCode } from '@/services/currencyConverter';

export function useCurrencyConversion() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Pre-fetch rates on mount
    currencyConverter.getRates().then(() => {
      setIsLoading(false);
    });
  }, []);

  /**
   * Convert to BTC (uses cached rates, returns immediately)
   */
  const convertToBTC = (amount: number, fromCurrency: string): number => {
    if (amount === 0 || !fromCurrency) {
      return 0;
    }

    const currency = fromCurrency.toUpperCase() as CurrencyCode;

    // For BTC/SATS, no API call needed
    if (currency === 'BTC') {
      return amount;
    }
    if (currency === 'SATS') {
      return amount / 100_000_000;
    }

    // Use last cached rates (synchronous)
    // This is safe because we pre-fetch in useEffect
    // For real-time accuracy, the service auto-refreshes every minute
    try {
      // Get cached rates synchronously
      const rates = (currencyConverter as any).rates;
      if (!rates) {
        return 0;
      }

      switch (currency) {
        case 'CHF':
          return amount / rates.btcToChf;
        case 'USD':
          return amount / rates.btcToUsd;
        case 'EUR':
          return amount / rates.btcToEur;
        default:
          return 0;
      }
    } catch {
      return 0;
    }
  };

  /**
   * Convert from BTC (uses cached rates, returns immediately)
   */
  const convertFromBTC = (amountBTC: number, toCurrency: string): number => {
    if (amountBTC === 0 || !toCurrency) {
      return 0;
    }

    const currency = toCurrency.toUpperCase() as CurrencyCode;

    if (currency === 'BTC') {
      return amountBTC;
    }
    if (currency === 'SATS') {
      return Math.round(amountBTC * 100_000_000);
    }

    try {
      const rates = (currencyConverter as any).rates;
      if (!rates) {
        return 0;
      }

      switch (currency) {
        case 'CHF':
          return amountBTC * rates.btcToChf;
        case 'USD':
          return amountBTC * rates.btcToUsd;
        case 'EUR':
          return amountBTC * rates.btcToEur;
        default:
          return 0;
      }
    } catch {
      return 0;
    }
  };

  return {
    convertToBTC,
    convertFromBTC,
    isLoading,
  };
}
