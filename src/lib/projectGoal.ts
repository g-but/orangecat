'use server';

import { convertBtcToOrNull } from '@/services/currency/rates.server';

/**
 * A project's settled BTC total expressed in the currency its goal is written in.
 *
 * Returns null when there is no usable Bitcoin rate. That is not the same as
 * zero: "CHF 0 raised" tells a visitor the fundraiser has nothing, which is a
 * false claim about someone's project. Callers should fall back to showing the
 * Bitcoin figure instead.
 */
export async function computeAmountRaised(
  bitcoin_balance_btc: number,
  goal_currency: string
): Promise<number | null> {
  if (!bitcoin_balance_btc || bitcoin_balance_btc === 0) {
    return 0;
  }
  if (goal_currency === 'BTC') {
    return bitcoin_balance_btc;
  }
  return convertBtcToOrNull(bitcoin_balance_btc, goal_currency);
}
