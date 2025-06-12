// Currency utility functions for Bitcoin and Swiss franc conversions
// Replaces the old "bits" system with proper Bitcoin terminology

export interface CurrencyConversion {
  bitcoin: number      // Amount in BTC
  satoshis: number     // Amount in satoshis (smallest Bitcoin unit)
  chf: number         // Swiss franc equivalent
  usd: number         // USD equivalent for reference
}

// Mock exchange rates - in production these would come from real APIs
const EXCHANGE_RATES = {
  BTC_USD: 105000,   // 1 BTC = $105,000 USD (updated to current market)
  USD_CHF: 0.91,     // 1 USD = 0.91 CHF
  BTC_CHF: 95550,    // 1 BTC = 95,550 CHF (BTC_USD * USD_CHF)
}

export function satoshisToBitcoin(satoshis: number): number {
  return satoshis / 100000000 // 1 BTC = 100,000,000 satoshis
}

export function bitcoinToSatoshis(bitcoin: number): number {
  return Math.round(bitcoin * 100000000)
}

export function convertSatoshisToAll(satoshis: number): CurrencyConversion {
  const bitcoin = satoshisToBitcoin(satoshis)
  const chf = bitcoin * EXCHANGE_RATES.BTC_CHF
  const usd = bitcoin * EXCHANGE_RATES.BTC_USD
  
  return {
    bitcoin,
    satoshis,
    chf,
    usd
  }
}

export function convertBitcoinToAll(bitcoin: number): CurrencyConversion {
  const satoshis = bitcoinToSatoshis(bitcoin)
  const chf = bitcoin * EXCHANGE_RATES.BTC_CHF
  const usd = bitcoin * EXCHANGE_RATES.BTC_USD
  
  return {
    bitcoin,
    satoshis,
    chf,
    usd
  }
}

export function formatBitcoinDisplay(amount: number, unit: 'BTC' | 'sats' = 'BTC'): string {
  if (unit === 'sats') {
    return `${amount.toLocaleString('en-US')} sats`
  }
  
  if (amount >= 1) {
    return `${amount.toFixed(4)} BTC`
  } else if (amount >= 0.001) {
    return `${amount.toFixed(6)} BTC`
  } else {
    // For very small amounts, show in satoshis
    const sats = bitcoinToSatoshis(amount)
    return `${sats.toLocaleString('en-US')} sats`
  }
}

export function formatSwissFrancs(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatBitcoinWithChf(conversion: CurrencyConversion): {
  bitcoin: string
  chf: string
  combined: string
} {
  const bitcoinStr = formatBitcoinDisplay(conversion.bitcoin)
  const chfStr = formatSwissFrancs(conversion.chf)
  
  return {
    bitcoin: bitcoinStr,
    chf: chfStr,
    combined: `${bitcoinStr} (${chfStr})`
  }
}

// Hook for real-time price data (placeholder for future implementation)
export function useBitcoinPrice() {
  // In production, this would fetch real-time data from CoinGecko, CoinMarketCap, etc.
  return {
    btcUsd: EXCHANGE_RATES.BTC_USD,
    btcChf: EXCHANGE_RATES.BTC_CHF,
    usdChf: EXCHANGE_RATES.USD_CHF,
    isLoading: false,
    error: null
  }
}

// Regional display utilities
export function getRegionName(): string {
  // For now, hardcoded to Switzerland
  // Later this will be dynamic based on user location
  return "Switzerland"
}

export function getRegionEmoji(): string {
  // For now, hardcoded to Swiss flag
  // Later this will be dynamic based on user location
  return "🇨🇭"
}

export function formatRegionalAlternatives(): string {
  return "alternatives popular in your region"
}

// Add comprehensive Bitcoin & fiat currency utilities used by test suite

// Utility: ensure a finite number, otherwise fallback
const safeNumber = (value: number, fallback = 0): number =>
  typeof value === 'number' && isFinite(value) ? value : fallback;

// -------------------------
// Formatting helpers
// -------------------------

export function formatBTC(amount: number): string {
  const value = safeNumber(amount);
  // Always show exactly 8 decimals, thousands separators allowed for large values
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  })} BTC`;
}

export function formatSats(amount: number): string {
  const value = safeNumber(Math.round(amount)); // sats must be whole numbers
  return `${value.toLocaleString('en-US')} sats`;
}

export function formatUSD(amount: number): string {
  const value = safeNumber(amount);
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Generic formatter that delegates based on currency code
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
): string {
  const normalized = currency.toUpperCase();
  switch (normalized) {
    case 'USD':
      return formatUSD(amount);
    case 'BTC':
      return formatBTC(amount);
    case 'SATS':
      return formatSats(amount);
    default: {
      const value = safeNumber(amount);
      return `${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${currency}`;
    }
  }
}

// -------------------------
// Low-level conversions
// -------------------------

export const btcToSats = bitcoinToSatoshis;
export const satsToBTC = satoshisToBitcoin;

// -------------------------
// Parsing helpers
// -------------------------

export function parseBTCAmount(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/btc/i, '').trim();
  const value = parseFloat(cleaned);
  return safeNumber(value);
}

// Validate BTC amount (0 ≤ amount ≤ 21M, max 8 decimal places)
export function validateBTCAmount(amount: number): boolean {
  if (typeof amount !== 'number' || !isFinite(amount)) return false;
  if (amount < 0 || amount > 21000000) return false;
  // Ensure no more than 8 decimal places
  const decimals = (amount.toString().split('.')[1] || '').length;
  return decimals <= 8;
}

// -------------------------
// Currency conversion
// -------------------------

type CurrencyCode = 'BTC' | 'SATS' | 'USD' | string;

type Rates = Record<string, number>;

// Build default conversion table from EXCHANGE_RATES
const DEFAULT_RATES: Rates = {
  'BTC/USD': EXCHANGE_RATES.BTC_USD,
  'USD/BTC': 1 / EXCHANGE_RATES.BTC_USD,
};

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  exchangeRates: Rates = DEFAULT_RATES,
): number {
  if (!isFinite(amount)) return 0;

  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();

  // Same currency, nothing to do.
  if (fromUpper === toUpper) return amount;

  // Handle BTC / SATS directly without exchangeRates
  if (fromUpper === 'BTC' && toUpper === 'SATS') {
    return btcToSats(amount);
  }
  if (fromUpper === 'SATS' && toUpper === 'BTC') {
    return satsToBTC(amount);
  }

  // Try direct rate first (e.g., 'BTC/USD')
  const directKey = `${fromUpper}/${toUpper}`;
  const directRate = exchangeRates[directKey];
  if (typeof directRate === 'number') {
    return amount * directRate;
  }

  // If inverse exists, use 1/rate
  const inverseKey = `${toUpper}/${fromUpper}`;
  const inverseRate = exchangeRates[inverseKey];
  if (typeof inverseRate === 'number' && inverseRate !== 0) {
    return amount / inverseRate;
  }

  // Unable to convert
  return 0;
} 