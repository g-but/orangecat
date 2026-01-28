/**
 * USE DISPLAY CURRENCY HOOK
 *
 * Provides formatting of sats amounts in the user's preferred display currency.
 * Combines useUserCurrency + useCurrencyConversion + formatCurrency in one hook.
 *
 * This is the RECOMMENDED way to display prices/amounts in components.
 * It respects the user's currency preference (defaults to CHF).
 *
 * Created: 2026-01-28
 * Last Modified: 2026-01-28
 * Last Modified Summary: Initial implementation for SSOT currency display
 */

'use client';

import { useCallback } from 'react';
import { useUserCurrency, isFiatCurrency } from './useUserCurrency';
import { useCurrencyConversion } from './useCurrencyConversion';
import { formatCurrency, formatSats, satsToBitcoin } from '@/services/currency';
import type { CurrencyCode } from '@/config/currencies';

export interface DisplayCurrencyOptions {
  /** Show currency symbol (default: true) */
  showSymbol?: boolean;
  /** Compact format for large numbers (default: false) */
  compact?: boolean;
  /** Always show in sats regardless of user preference */
  forceSats?: boolean;
  /** Show both fiat and sats (e.g., "CHF 86.00 (100,000 sats)") */
  showBoth?: boolean;
}

export interface UseDisplayCurrencyReturn {
  /** Format sats amount in user's preferred display currency */
  formatAmount: (sats: number, options?: DisplayCurrencyOptions) => string;
  /** User's preferred display currency code */
  displayCurrency: CurrencyCode;
  /** Whether user prefers fiat (CHF/EUR/USD) vs crypto (BTC/SATS) */
  prefersFiat: boolean;
  /** Whether exchange rates are still loading */
  isLoading: boolean;
}

/**
 * Hook for displaying amounts in the user's preferred currency.
 *
 * @example
 * ```tsx
 * const { formatAmount } = useDisplayCurrency();
 *
 * // Shows "CHF 86.00" or "100,000 sats" based on user preference
 * <span>{formatAmount(100000)}</span>
 *
 * // Show both fiat and sats
 * <span>{formatAmount(100000, { showBoth: true })}</span>
 * // → "CHF 86.00 (100,000 sats)"
 * ```
 */
export function useDisplayCurrency(): UseDisplayCurrencyReturn {
  const displayCurrency = useUserCurrency() as CurrencyCode;
  const { convertFromBTC, isLoading } = useCurrencyConversion();
  const prefersFiat = isFiatCurrency(displayCurrency);

  const formatAmount = useCallback(
    (sats: number, options: DisplayCurrencyOptions = {}): string => {
      const { showSymbol = true, compact = false, forceSats = false, showBoth = false } = options;

      // Handle zero/invalid amounts
      if (!sats || sats === 0) {
        if (forceSats || displayCurrency === 'SATS') {
          return '0 sats';
        }
        if (displayCurrency === 'BTC') {
          return showSymbol ? '₿0' : '0';
        }
        return formatCurrency(0, displayCurrency, { showSymbol, compact });
      }

      // If user prefers sats or forceSats is true
      if (forceSats || displayCurrency === 'SATS') {
        const satsFormatted = formatSats(sats);
        return satsFormatted;
      }

      // If user prefers BTC
      if (displayCurrency === 'BTC') {
        const btc = satsToBitcoin(sats);
        return formatCurrency(btc, 'BTC', { showSymbol, compact });
      }

      // Convert to user's fiat currency
      const btc = satsToBitcoin(sats);
      const fiatAmount = convertFromBTC(btc, displayCurrency);

      // If rates not loaded yet, fall back to sats
      if (isLoading || fiatAmount === 0) {
        return formatSats(sats);
      }

      const fiatFormatted = formatCurrency(fiatAmount, displayCurrency, { showSymbol, compact });

      // Show both fiat and sats if requested
      if (showBoth) {
        return `${fiatFormatted} (${formatSats(sats)})`;
      }

      return fiatFormatted;
    },
    [displayCurrency, convertFromBTC, isLoading]
  );

  return {
    formatAmount,
    displayCurrency,
    prefersFiat,
    isLoading,
  };
}

/**
 * Non-hook version for server components or static rendering.
 * Always shows sats since we can't access user preferences or rates.
 */
export function formatAmountStatic(sats: number): string {
  return formatSats(sats);
}
