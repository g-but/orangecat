/**
 * Currency Service Types
 */

export interface ExchangeRates {
  btcToChf: number;
  btcToUsd: number;
  btcToEur: number;
  lastUpdated: number;
}

export interface RateCache {
  rates: Record<string, number>;
  lastUpdated: Date | null;
  expiresAt: Date | null;
}

export interface CurrencyBreakdown {
  btc: number;
  sats: number;
  fiat: Record<string, number>;
}

export interface CurrencyConversion {
  bitcoin: number;
  sats: number;
  chf: number;
  usd: number;
}
