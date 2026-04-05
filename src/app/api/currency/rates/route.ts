/**
 * Currency Rates API Route
 *
 * Proxies CoinGecko's simple/price endpoint and caches server-side.
 * Returns BTC → USD/EUR/CHF/GBP exchange rates.
 *
 * Used by useDisplayCurrency hook to show amounts in user's preferred fiat.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

interface CachedRates {
  rates: Record<string, number>;
  fetchedAt: number;
}

// Server-side cache (process-lifetime, resets on restart)
let cached: CachedRates | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

// Reasonable fallback rates if CoinGecko is down (updated manually periodically)
const FALLBACK_RATES: Record<string, number> = {
  BTC_USD: 97000,
  BTC_EUR: 91000,
  BTC_CHF: 86000,
  BTC_GBP: 78000,
};

async function fetchFromCoinGecko(): Promise<Record<string, number> | null> {
  try {
    const resp = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,chf,gbp',
      {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: 'application/json' },
      }
    );

    if (!resp.ok) {
      logger.warn('CoinGecko rate fetch failed', { status: resp.status }, 'CurrencyRates');
      return null;
    }

    const data = await resp.json();
    const btc = data.bitcoin;
    if (!btc) return null;

    return {
      BTC_USD: btc.usd,
      BTC_EUR: btc.eur,
      BTC_CHF: btc.chf,
      BTC_GBP: btc.gbp,
    };
  } catch (error) {
    logger.warn(
      'CoinGecko fetch error',
      { error: error instanceof Error ? error.message : error },
      'CurrencyRates'
    );
    return null;
  }
}

export async function GET() {
  // Return cached if fresh
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(
      { rates: cached.rates, cached: true, fetchedAt: cached.fetchedAt },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  }

  // Try to fetch fresh rates
  const fresh = await fetchFromCoinGecko();
  if (fresh) {
    cached = { rates: fresh, fetchedAt: Date.now() };
    return NextResponse.json(
      { rates: fresh, cached: false, fetchedAt: cached.fetchedAt },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  }

  // Use fallback (or stale cache if we have it)
  const rates = cached?.rates ?? FALLBACK_RATES;
  return NextResponse.json(
    { rates, cached: true, fallback: !cached },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30',
      },
    }
  );
}
