/**
 * Currency Converter Service - Re-exports from SSOT
 *
 * DEPRECATED: Import directly from '@/services/currency' instead.
 * This file exists for backwards compatibility only.
 *
 * SSOT: @/services/currency
 */

export {
  type ExchangeRates,
  currencyConverter,
  convertToBTC,
  convertFromBTC,
  convertCurrencyAsync as convertCurrency,
} from '@/services/currency';
