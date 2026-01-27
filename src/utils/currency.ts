/**
 * Currency Utilities - Re-exports from SSOT
 *
 * DEPRECATED: Import directly from '@/services/currency' instead.
 * This file exists for backwards compatibility only.
 *
 * SSOT: @/services/currency
 */

// Re-export everything from the SSOT
export {
  // Types
  type CurrencyConversion,
  type CurrencyBreakdown,
  type ExchangeRates,
  // Core conversions
  satsToBitcoin,
  satsToBTC,
  satsToBtc,
  bitcoinToSats,
  btcToSats,
  satoshisToBitcoin,
  bitcoinToSatoshis,
  convertBtcTo,
  convertToBtc,
  convert,
  convertBitcoinToAll,
  convertSatsToAll,
  // Formatting
  formatCurrency,
  formatBitcoinDisplay,
  formatSwissFrancs,
  formatBTC,
  formatSats,
  formatUSD,
  // Rate management
  getRate,
  updateRates,
  fetchRates,
  ratesNeedRefresh,
  getCurrencyBreakdown,
  // Input helpers
  parseAmount,
  validateAmount,
  // Regional utilities
  getRegionName,
  getRegionEmoji,
  formatRegionalAlternatives,
  // Hook
  useBitcoinPrice,
  // Async converter service
  currencyConverter,
  convertToBTC,
  convertFromBTC,
  convertCurrencyAsync,
  // Default export
  currencyService,
} from '@/services/currency';

// For backwards compatibility with test suite
export { currencyService as default } from '@/services/currency';
