'use client';

import { useEffect, useState } from 'react';
import { Bitcoin } from 'lucide-react';
import { currencyConverter } from '@/services/currencyConverter';
import type { CurrencyCode } from '@/config/currencies';

interface BTCAmountDisplayProps {
  amount: number;
  currency: CurrencyCode;
  className?: string;
  showIcon?: boolean;
}

/**
 * Displays amount in both original currency and BTC equivalent
 * Automatically updates when BTC price changes
 */
export default function BTCAmountDisplay({
  amount,
  currency,
  className = '',
  showIcon = true,
}: BTCAmountDisplayProps) {
  const [btcAmount, setBtcAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip conversion if already in BTC/SATS
    if (currency === 'BTC' || currency === 'SATS') {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const updateBTC = async () => {
      if (amount === 0) {
        if (mounted) {
          setBtcAmount('');
          setIsLoading(false);
        }
        return;
      }

      try {
        const btc = await currencyConverter.toBTC(amount, currency);
        if (mounted) {
          setBtcAmount(currencyConverter.formatBTC(btc));
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setBtcAmount('');
          setIsLoading(false);
        }
      }
    };

    updateBTC();

    // Refresh BTC amount every 30 seconds to reflect price changes
    const interval = setInterval(updateBTC, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [amount, currency]);

  // If already in BTC/SATS, just show the amount
  if (currency === 'BTC' || currency === 'SATS') {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        {showIcon && <Bitcoin className="w-3 h-3 text-bitcoinOrange" />}
        <span>
          {currencyConverter.formatBTC(currency === 'BTC' ? amount : amount / 100_000_000)}
        </span>
      </span>
    );
  }

  // Show fiat amount with BTC equivalent (only if loaded and not zero)
  if (isLoading || !btcAmount || amount === 0) {
    return null;
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-gray-600 ${className}`}>
      {showIcon && <Bitcoin className="w-3 h-3 text-bitcoinOrange" />}
      <span>{btcAmount}</span>
    </span>
  );
}
