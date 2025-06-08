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