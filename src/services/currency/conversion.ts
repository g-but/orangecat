/**
 * Currency Conversion Functions
 *
 * Synchronous conversion between BTC, sats, and fiat currencies.
 */

import { cache } from './rates';
import type { CurrencyBreakdown, CurrencyConversion } from './types';

// ==================== BTC <-> SATS ====================

export function satsToBitcoin(sats: number): number {
  return sats / 100_000_000;
}

export function bitcoinToSats(bitcoin: number): number {
  return Math.round(bitcoin * 100_000_000);
}

// Aliases for common naming conventions
export const satsToBTC = satsToBitcoin;
export const satsToBtc = satsToBitcoin;
export const btcToSats = bitcoinToSats;
export const satoshisToBitcoin = satsToBitcoin;
export const bitcoinToSatoshis = bitcoinToSats;

// ==================== CORE CONVERSION ====================

export function convertBtcTo(amount: number, targetCurrency: string): number {
  if (targetCurrency === 'BTC') {
    return amount;
  }
  if (targetCurrency === 'SATS') {
    return Math.round(amount * 100_000_000);
  }
  const rate = cache.rates[`BTC_${targetCurrency}`] || 0;
  return amount * rate;
}

export function convertToBtc(amount: number, fromCurrency: string): number {
  if (fromCurrency === 'BTC') {
    return amount;
  }
  if (fromCurrency === 'SATS') {
    return amount / 100_000_000;
  }
  const rate = cache.rates[`BTC_${fromCurrency}`] || 1;
  return amount / rate;
}

export function convert(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  const btc = convertToBtc(amount, fromCurrency);
  return convertBtcTo(btc, toCurrency);
}

/**
 * Synchronous currency conversion with optional explicit exchange rates.
 * Returns 0 when conversion isn't possible.
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  exchangeRates?: Record<string, number>
): number {
  if (!isFinite(amount) || amount === 0) {
    return 0;
  }
  if (from === to) {
    return amount;
  }

  if (from === 'BTC' && to === 'SATS') {
    return bitcoinToSats(amount);
  }
  if (from === 'SATS' && to === 'BTC') {
    return satsToBitcoin(amount);
  }

  const rateKey = `${from}/${to}`;
  const rate = exchangeRates?.[rateKey];
  if (rate) {
    return amount * rate;
  }

  return 0;
}

// ==================== MULTI-CURRENCY RESULTS ====================

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

export function convertBitcoinToAll(bitcoin: number): CurrencyConversion {
  return {
    bitcoin,
    sats: bitcoinToSats(bitcoin),
    chf: convertBtcTo(bitcoin, 'CHF'),
    usd: convertBtcTo(bitcoin, 'USD'),
  };
}

export function convertSatsToAll(sats: number): CurrencyConversion {
  return convertBitcoinToAll(satsToBitcoin(sats));
}
