/**
 * Synchronous currency conversion for components.
 *
 * Reads the shared rate cache (SSOT: /src/services/currency). Rates normally
 * arrive with the page — CurrencyRatesProvider seeds the cache from the server
 * before anything renders — so `isLoading` is false on the very first paint and
 * amounts are shown in the visitor's own currency straight away. The fetch-on-
 * mount path below is the fallback for trees rendered without that provider
 * (tests, isolated stories).
 *
 * An unknown rate returns 0, which display code reads as "keep showing BTC".
 * It never guesses: a plausible wrong rate is the one bug nobody notices.
 */

import { useState, useEffect } from 'react';
import { currencyConverter, getRate } from '@/services/currency/rates';
import { useRatesReady } from '@/components/providers/CurrencyRatesProvider';

export function useCurrencyConversion() {
  const ratesReady = useRatesReady();
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (ratesReady) {
      return;
    }
    let cancelled = false;
    currencyConverter
      .getRates()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setFetched(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ratesReady]);

  const convertToBTC = (amount: number, fromCurrency: string): number => {
    if (!amount || !fromCurrency) {
      return 0;
    }
    const rate = getRate(fromCurrency.toUpperCase());
    return rate ? amount / rate : 0;
  };

  const convertFromBTC = (amountBTC: number, toCurrency: string): number => {
    if (!amountBTC || !toCurrency) {
      return 0;
    }
    const rate = getRate(toCurrency.toUpperCase());
    return rate ? amountBTC * rate : 0;
  };

  return {
    convertToBTC,
    convertFromBTC,
    isLoading: !ratesReady && !fetched,
  };
}
