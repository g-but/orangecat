'use server';

import { exchangeRates } from '@/services/exchangeRates';

/** Compute amount raised in goal currency from BTC balance. */
export async function computeAmountRaised(
  bitcoin_balance_btc: number,
  goal_currency: string
): Promise<number> {
  if (!bitcoin_balance_btc || bitcoin_balance_btc === 0) {
    return 0;
  }
  if (goal_currency === 'BTC') {
    return bitcoin_balance_btc;
  }

  const rates = await exchangeRates.getRates();

  const rate =
    goal_currency === 'CHF'
      ? rates.btcToChf
      : goal_currency === 'USD'
        ? rates.btcToUsd
        : goal_currency === 'EUR'
          ? rates.btcToEur
          : 0;

  return bitcoin_balance_btc * rate;
}

import { exchangeRates } from '@/services/exchangeRates';

/**
 * Compute amount raised in goal currency from BTC balance.
 * Falls back to 0 for unknown currencies.
 */
export async function computeAmountRaised(
  bitcoin_balance_btc: number,
  goal_currency: string
): Promise<number> {
  if (!bitcoin_balance_btc || bitcoin_balance_btc === 0) {
    return 0;
  }
  if (goal_currency === 'BTC') {
    return bitcoin_balance_btc;
  }

  const rates = await exchangeRates.getRates();

  const rate =
    goal_currency === 'CHF'
      ? rates.btcToChf
      : goal_currency === 'USD'
        ? rates.btcToUsd
        : goal_currency === 'EUR'
          ? rates.btcToEur
          : 0;

  return bitcoin_balance_btc * rate;
}
