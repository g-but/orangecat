/**
 * Currency Service Types
 */

export interface ExchangeRates {
  btcToChf: number;
  btcToUsd: number;
  btcToEur: number;
  /** GBP is a supported display currency; omitting it here silently converted to 0. */
  btcToGbp: number;
  lastUpdated: number;
}

export interface RateCache {
  rates: Record<string, number>;
  lastUpdated: Date | null;
  expiresAt: Date | null;
}
