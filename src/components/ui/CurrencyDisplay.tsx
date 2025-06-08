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
  currency: 'BTC' | 'USD' | 'CHF' | 'SATS';
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
  const colorConfig = componentColors.currencyDisplay(currency);
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-medium',
    xl: 'text-xl font-semibold',
  };
  
  const formatAmount = (amount: number | string, currency: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    switch (currency) {
      case 'BTC':
        return showSymbol ? `${numAmount.toFixed(8)} BTC` : numAmount.toFixed(8);
      case 'SATS':
        return showSymbol ? `${numAmount.toLocaleString('en-US')} sats` : numAmount.toLocaleString('en-US');
      case 'USD':
        return showSymbol ? `$${numAmount.toLocaleString('en-US')}` : numAmount.toLocaleString('en-US');
      case 'CHF':
        return showSymbol ? `${numAmount.toLocaleString('en-US')} CHF` : numAmount.toLocaleString('en-US');
      default:
        return showSymbol ? `${numAmount} ${currency}` : numAmount.toString();
    }
  };

  return (
    <span
      className={cn(
        colorConfig.className,
        sizeClasses[size],
        'font-mono tabular-nums',
        className
      )}
      style={colorConfig.style}
    >
      {formatAmount(amount, currency)}
    </span>
  );
};

export default CurrencyDisplay; 