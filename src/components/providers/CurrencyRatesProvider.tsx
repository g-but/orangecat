'use client';

/**
 * Hands the browser the rates the server already had.
 *
 * Without this, every visitor's first paint was denominated in Bitcoin and only
 * flipped to their own currency once a client-side fetch landed — around a
 * second when warm, and far worse cold. For a stranger being asked to name an
 * amount, that first second is the whole decision: "0.0001 BTC" is a question
 * they can't answer, "CHF 5" is one they can.
 *
 * The snapshot is applied synchronously while this provider renders, before any
 * child renders, so server and client agree on the very first pass and there is
 * nothing to flip. A snapshot older than the cache's tolerance is ignored
 * outright — a page prerendered at build time must not ship a fossilised rate.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import {
  applyRateSnapshot,
  currencyConverter,
  hasUsableRates,
  type RateSnapshotLike,
} from '@/services/currency/rates';

/** True once real, unexpired rates are in the cache. */
const RatesReadyContext = createContext(false);

export function useRatesReady(): boolean {
  return useContext(RatesReadyContext);
}

/**
 * Rates go stale, and a page left open (a payment screen, say) must not quietly
 * start quoting yesterday's number. Refresh well inside the cache's own 15-minute
 * tolerance; the endpoint is our own origin and caches for 30s, so this is cheap.
 */
const REFRESH_MS = 5 * 60_000;

export function CurrencyRatesProvider({
  initialSnapshot,
  children,
}: {
  initialSnapshot: RateSnapshotLike | null;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(() => {
    applyRateSnapshot(initialSnapshot);
    return hasUsableRates();
  });

  useEffect(() => {
    let cancelled = false;

    const sync = () => {
      currencyConverter
        .getRates()
        .then(() => {
          if (!cancelled) {
            setReady(hasUsableRates());
          }
        })
        .catch(() => {
          // rates.ts already logged it; amounts stay in BTC, which is honest.
        });
    };

    if (!hasUsableRates()) {
      sync();
    }
    const timer = setInterval(sync, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return <RatesReadyContext.Provider value={ready}>{children}</RatesReadyContext.Provider>;
}
