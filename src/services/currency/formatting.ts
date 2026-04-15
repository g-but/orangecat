/**
 * Currency Formatting & Display
 *
 * All user-facing currency formatting functions.
 */

import { CURRENCY_METADATA } from '@/config/currencies';
import { bitcoinToSats } from './conversion';

// ==================== GENERAL FORMATTING ====================

export function formatCurrency(
  amount: number,
  currency: string,
  options: {
    showSymbol?: boolean;
    compact?: boolean;
    locale?: string;
  } = {}
): string {
  const { showSymbol = true, compact = false, locale = 'en-US' } = options;
  const metadata = CURRENCY_METADATA[currency as keyof typeof CURRENCY_METADATA];

  if (!metadata) {
    return amount.toLocaleString(locale);
  }

  if (currency === 'SATS') {
    const formatted =
      compact && amount >= 1000000
        ? `${(amount / 1000000).toFixed(1)}M`
        : amount.toLocaleString(locale, { maximumFractionDigits: 0 });
    return showSymbol ? `${formatted} sat` : formatted;
  }

  if (currency === 'BTC') {
    const formatted = amount.toFixed(8).replace(/\.?0+$/, '');
    return showSymbol ? `₿${formatted}` : formatted;
  }

  // Fiat currencies
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: compact ? 0 : metadata.precision,
    maximumFractionDigits: metadata.precision,
  });

  if (!showSymbol) {
    return formatted;
  }

  switch (currency) {
    case 'USD':
      return `$${formatted}`;
    case 'EUR':
      return `€${formatted}`;
    case 'GBP':
      return `£${formatted}`;
    case 'CHF':
      return `CHF ${formatted}`;
    default:
      return `${formatted} ${currency}`;
  }
}

// ==================== BITCOIN DISPLAY ====================

export function formatBitcoinDisplay(amount: number, unit: 'BTC' | 'sats' = 'BTC'): string {
  if (unit === 'sats') {
    return `${amount.toLocaleString('en-US')} sat`;
  }

  if (amount >= 1) {
    return `${amount.toFixed(4)} BTC`;
  } else if (amount >= 0.001) {
    return `${amount.toFixed(6)} BTC`;
  } else {
    const sats = bitcoinToSats(amount);
    return `${sats.toLocaleString('en-US')} sat`;
  }
}

export function formatBTC(amount: number): string {
  const value = typeof amount === 'number' && isFinite(amount) ? amount : 0;
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  })} BTC`;
}

export function formatSats(amount: number): string {
  const value = typeof amount === 'number' && isFinite(amount) ? Math.round(amount) : 0;
  return `${value.toLocaleString('en-US')} sat`;
}

// ==================== FIAT DISPLAY ====================

export function formatSwissFrancs(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  const value = typeof amount === 'number' && isFinite(amount) ? amount : 0;
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ==================== REGIONAL DISPLAY ====================

export function getRegionName(): string {
  return 'Switzerland';
}

export function getRegionEmoji(): string {
  return '🇨🇭';
}

export function formatRegionalAlternatives(): string {
  return 'alternatives popular in your region';
}

/**
 * Format BTC for clean display — strips unnecessary trailing zeros.
 * 0.001 → "0.001", 0.00500000 → "0.005", 1.0 → "1"
 */
export function displayBTC(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (!isFinite(num) || num === 0) {return '0 BTC';}
  // Show up to 8 decimals but strip trailing zeros
  return `${parseFloat(num.toFixed(8))} BTC`;
}
