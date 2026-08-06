/**
 * Currency Conversion Functions
 *
 * Synchronous conversion between BTC, sats, and fiat currencies.
 *
 * These read the in-memory `cache.rates`, which starts EMPTY and is filled only
 * from a real, recent quote (see rateSource.server.ts). A missing rate therefore
 * means "we do not know what Bitcoin is worth right now" — an ordinary, expected
 * state, not an unsupported currency. Either way we must NOT fabricate a value:
 * `amount / 1` would render "100 CHF" as "100 BTC", and a *plausible* wrong rate
 * is worse still because nothing on screen looks amiss. Unknown fails safe to 0
 * and warns; display code reads 0 as "keep showing BTC".
 *
 * These are the DISPLAY conversions. Anything that prices money server-side must
 * use rates.server.ts, whose helpers return `number | null` so a zero can never
 * be mistaken for an amount.
 */

import { logger } from '@/utils/logger';
import { cache } from './rates';

const SATS_PER_BTC = 100_000_000;

// ==================== BTC <-> SATS ====================

export function satsToBitcoin(sats: number): number {
  return sats / SATS_PER_BTC;
}

export function bitcoinToSats(bitcoin: number): number {
  return Math.round(bitcoin * SATS_PER_BTC);
}

// ==================== CORE CONVERSION ====================

export function convertBtcTo(amount: number, targetCurrency: string): number {
  if (targetCurrency === 'BTC') {
    return amount;
  }
  if (targetCurrency === 'SATS') {
    return Math.round(amount * SATS_PER_BTC);
  }
  const rate = cache.rates[`BTC_${targetCurrency}`];
  if (!rate) {
    logger.warn('No BTC rate for currency; cannot convert', { targetCurrency }, 'Currency');
    return 0;
  }
  return amount * rate;
}

export function convertToBtc(amount: number, fromCurrency: string): number {
  if (fromCurrency === 'BTC') {
    return amount;
  }
  if (fromCurrency === 'SATS') {
    return amount / SATS_PER_BTC;
  }
  const rate = cache.rates[`BTC_${fromCurrency}`];
  if (!rate) {
    // Fail safe to 0 — never treat an unpriced fiat amount as if it were BTC.
    logger.warn('No BTC rate for currency; cannot convert', { fromCurrency }, 'Currency');
    return 0;
  }
  return amount / rate;
}

export function convert(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  const btc = convertToBtc(amount, fromCurrency);
  return convertBtcTo(btc, toCurrency);
}
