/**
 * USER CURRENCY HOOK
 *
 * Provides the user's preferred currency from their profile/settings.
 * Falls back to DEFAULT_CURRENCY ('USD') if not set.
 *
 * Created: 2025-01-03
 * Last Modified: 2025-01-03
 * Last Modified Summary: Initial implementation for user currency preference
 */

'use client';

import { useAuthStore } from '@/stores/auth';
import { DEFAULT_CURRENCY, type CurrencyCode, isSupportedCurrency } from '@/config/currencies';
import type { Currency } from '@/types/settings';

/**
 * Returns the user's preferred display currency.
 * Falls back to DEFAULT_CURRENCY ('USD') if not set or invalid.
 */
export function useUserCurrency(): Currency {
  const profile = useAuthStore((state) => state.profile);

  // Check if profile has a currency setting
  // Note: currency might be in profile or in settings depending on implementation
  const profileCurrency = (profile as Record<string, unknown> | null)?.currency as string | undefined;

  if (profileCurrency && isSupportedCurrency(profileCurrency)) {
    return profileCurrency as Currency;
  }

  // Default to CHF as the platform is Swiss-focused
  return 'CHF';
}

/**
 * Get the default currency for entity creation forms.
 * This is used when initializing form values.
 * Returns 'CHF' as the platform default (Swiss-focused).
 */
export function getDefaultFormCurrency(): Currency {
  return 'CHF';
}

/**
 * Check if a currency is a fiat currency (not BTC/SATS)
 */
export function isFiatCurrency(currency: string): boolean {
  return ['CHF', 'EUR', 'USD', 'GBP'].includes(currency);
}

/**
 * Check if a currency is a crypto currency (BTC/SATS)
 */
export function isCryptoCurrency(currency: string): boolean {
  return ['BTC', 'SATS'].includes(currency);
}
