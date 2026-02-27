/**
 * CurrencyDisplay Component
 *
 * Reusable component for displaying currency amounts with appropriate colors.
 * Automatically uses Bitcoin Orange for BTC amounts and neutral colors for others.
 *
 * Created: June 5, 2025
 * Last Modified: June 5, 2025
 * Last Modified Summary: Initial creation
 */

import React from 'react';
import { componentColors } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number | string;
  currency: 'BTC' | 'USD' | 'CHF' | 'EUR' | 'SATS' | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSymbol?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency,
  size = 'md',
  className,
  showSymbol = true,
}) => {
  const colorConfig = componentColors.currencyDisplay(currency as 'BTC' | 'USD' | 'CHF' | 'SATS');

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-medium',
    xl: 'text-xl font-semibold',
  };

  const formatAmount = (amount: number | string, currency: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Handle NaN or invalid numbers
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      return showSymbol ? `0 ${currency}` : '0';
    }

    switch (currency) {
      case 'BTC':
        // BTC: up to 8 decimal places, remove trailing zeros
        const btcFormatted = numAmount.toFixed(8).replace(/\.?0+$/, '');
        return showSymbol ? `${btcFormatted} BTC` : btcFormatted;
      case 'SATS':
        // SATS: no decimals, with thousand separators
        return showSymbol
          ? `${Math.round(numAmount).toLocaleString('en-US')} sat`
          : Math.round(numAmount).toLocaleString('en-US');
      case 'USD':
        // Fiat currencies: 2 decimal places
        const usdFormatted = numAmount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return showSymbol ? `$${usdFormatted}` : usdFormatted;
      case 'CHF':
      case 'EUR':
      case 'GBP':
      case 'JPY':
      case 'CAD':
      case 'AUD':
      case 'NZD':
        // Fiat currencies: 2 decimal places (except JPY which is typically 0)
        const fiatFormatted =
          currency === 'JPY'
            ? Math.round(numAmount).toLocaleString('en-US')
            : numAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
        return showSymbol ? `${fiatFormatted} ${currency}` : fiatFormatted;
      default:
        // Unknown currencies: try to format as fiat (2 decimals)
        const defaultFormatted = numAmount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return showSymbol ? `${defaultFormatted} ${currency}` : defaultFormatted;
    }
  };

  return (
    <span
      className={cn(colorConfig.className, sizeClasses[size], 'font-mono tabular-nums', className)}
      style={colorConfig.style}
    >
      {formatAmount(amount, currency)}
    </span>
  );
};

export default CurrencyDisplay;
