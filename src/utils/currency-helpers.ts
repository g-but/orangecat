/**
 * Currency Helper Utilities
 * 
 * Provides helper functions to determine currency characteristics
 * and behavior differences between fiat and Bitcoin-native currencies.
 * 
 * Created: 2026-01-05
 * Last Modified: 2026-01-05
 * Last Modified Summary: Initial implementation
 */

import { Currency } from '@/types/settings';

/**
 * Check if a currency is Bitcoin-native (BTC or SATS)
 * 
 * Bitcoin-native currencies work differently:
 * - Goals can ONLY be reached by donations (not price appreciation)
 * - No conversion needed for comparison (direct BTC comparison)
 * - Used by Bitcoin-native users who think in BTC/sats
 */
export function isBitcoinNativeCurrency(currency: Currency): boolean {
  return currency === 'BTC' || currency === 'SATS';
}

/**
 * Check if a currency is fiat (USD, CHF, EUR, etc.)
 * 
 * Fiat currencies:
 * - Goals can be reached by donations OR Bitcoin price appreciation
 * - Requires conversion from BTC balance to fiat for comparison
 * - Used by users who think in traditional currencies
 */
export function isFiatCurrency(currency: Currency): boolean {
  return !isBitcoinNativeCurrency(currency);
}

/**
 * Get a user-friendly explanation of how goals work for a currency
 */
export function getGoalExplanation(currency: Currency, isGoal: boolean = true): string {
  if (isBitcoinNativeCurrency(currency)) {
    return isGoal
      ? 'Bitcoin-native goal: Can only be reached by donations (not affected by Bitcoin price changes)'
      : 'Bitcoin-native amount: No conversion needed, works directly with Bitcoin';
  } else {
    return isGoal
      ? 'Fiat goal: Can be reached by donations OR Bitcoin price appreciation'
      : 'Fiat amount: Will be converted to Bitcoin when sending transactions';
  }
}

/**
 * Get a short hint for currency selection
 */
export function getCurrencyHint(currency: Currency): string {
  if (currency === 'BTC') {
    return 'Bitcoin-native: No fractions, direct BTC amounts';
  } else if (currency === 'SATS') {
    return 'Satoshis: For Bitcoin-native users who prefer whole numbers';
  } else {
    return 'Fiat: Can benefit from Bitcoin price appreciation';
  }
}
