// Legacy bitcoin utility - redirects to new currency utilities
// This file maintains backward compatibility while transitioning to the new system

import { 
  CurrencyConversion, 
  convertSatoshisToAll, 
  convertBitcoinToAll, 
  formatBitcoinDisplay as formatBitcoinAmount, 
  formatSwissFrancs, 
  formatBitcoinWithChf 
} from './currency'

// Legacy interface for backward compatibility
export interface PriceConversion {
  usd: number
  bitcoin: number
  /** @deprecated Use satoshis instead of bits */
  bits: number
  chf: number // Swiss francs
}

// Convert legacy PriceConversion to new CurrencyConversion
function legacyToNew(legacy: PriceConversion): CurrencyConversion {
  return convertBitcoinToAll(legacy.bitcoin)
}

// Convert new CurrencyConversion to legacy PriceConversion
function newToLegacy(modern: CurrencyConversion): PriceConversion {
  return {
    usd: modern.usd,
    bitcoin: modern.bitcoin,
    bits: modern.satoshis / 100, // 1 "bit" was 100 satoshis in old system
    chf: modern.chf
  }
}

/**
 * @deprecated Use convertSatoshisToAll or convertBitcoinToAll from currency.ts instead
 */
export function convertUSDToBitcoin(usdAmount: number): PriceConversion {
  // Rough conversion for backward compatibility
  const bitcoin = usdAmount / 45000 // Using mock rate
  const conversion = convertBitcoinToAll(bitcoin)
  return newToLegacy(conversion)
}

/**
 * @deprecated Use formatBitcoinDisplay from currency.ts instead
 * This now properly displays Bitcoin instead of "bits"
 */
export function formatBitcoinDisplay(conversion: PriceConversion): string {
  const modernConversion = legacyToNew(conversion)
  return formatBitcoinAmount(modernConversion.bitcoin)
}

/**
 * @deprecated Use formatSwissFrancs from currency.ts instead
 */
export function formatTooltipDisplay(conversion: PriceConversion): string {
  return formatSwissFrancs(conversion.chf)
}

/**
 * @deprecated Use useBitcoinPrice from currency.ts instead
 */
export function useBitcoinPrice() {
  // Redirect to new implementation
  const { useBitcoinPrice } = require('./currency')
  return useBitcoinPrice()
} 