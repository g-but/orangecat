'use client';

import { useState } from 'react';
import { convertBitcoinToAll, formatBitcoinDisplay, formatSwissFrancs } from '@/services/currency';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';

interface BitcoinDisplayProps {
  usdAmount: number;
  className?: string;
}

export default function BitcoinDisplay({ usdAmount, className = '' }: BitcoinDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { convertToBTC, isLoading } = useCurrencyConversion();

  const bitcoinAmount = convertToBTC(usdAmount, 'USD');
  const conversion = convertBitcoinToAll(bitcoinAmount);

  if (isLoading) {
    return (
      <span className={`inline-block h-5 w-20 animate-pulse rounded bg-gray-100 ${className}`} />
    );
  }

  return (
    <div
      className={`relative inline-block cursor-help ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="font-semibold">{formatBitcoinDisplay(conversion.bitcoin)}</span>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
          {formatSwissFrancs(conversion.chf)}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
