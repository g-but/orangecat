/**
 * Rates for server-side callers — rendering, and above all pricing.
 *
 * Split from rates.ts because this reaches the upstream directly and must never
 * be bundled for a browser. Everything here answers with `null` rather than a
 * number it cannot stand behind; the conversions deliberately return
 * `number | null` instead of the usual 0-means-unknown convention, because on
 * this side of the app the caller is often minting an invoice, and a zero that
 * looks like an amount is precisely the bug being designed out.
 */

import type { CurrencyCode } from '@/config/currencies';
import { getCachedRateSnapshot, getRateSnapshot } from './rateSource.server';
import { applyRateSnapshot, getRate } from './rates';

const SATS_PER_BTC = 100_000_000;

/**
 * Rates without touching the network — for server rendering, which must not
 * wait on a third party to paint a page.
 */
export function getRenderRates(): {
  rates: Readonly<Record<string, number>>;
  fetchedAt: number;
} | null {
  const snapshot = getCachedRateSnapshot();
  applyRateSnapshot(snapshot);
  return snapshot;
}

/** Rates, fetching if needed. For callers that must not guess. */
export async function loadServerRates(): Promise<boolean> {
  const snapshot = await getRateSnapshot();
  applyRateSnapshot(snapshot);
  return !!snapshot;
}

/**
 * Fiat → BTC, or null when we have no rate.
 *
 * Null is not an edge case to paper over: it means we cannot say what this price
 * is worth in Bitcoin, so no invoice should be minted for it.
 */
export async function convertToBtcOrNull(
  amount: number,
  fromCurrency: CurrencyCode | string
): Promise<number | null> {
  const code = String(fromCurrency).toUpperCase();
  if (code === 'BTC') {
    return amount;
  }
  if (code === 'SATS') {
    return amount / SATS_PER_BTC;
  }
  await loadServerRates();
  const rate = getRate(code);
  return rate ? amount / rate : null;
}

/** BTC → fiat, or null when we have no rate. */
export async function convertBtcToOrNull(
  amountBtc: number,
  toCurrency: CurrencyCode | string
): Promise<number | null> {
  const code = String(toCurrency).toUpperCase();
  if (code === 'BTC') {
    return amountBtc;
  }
  if (code === 'SATS') {
    return Math.round(amountBtc * SATS_PER_BTC);
  }
  await loadServerRates();
  const rate = getRate(code);
  return rate ? amountBtc * rate : null;
}
