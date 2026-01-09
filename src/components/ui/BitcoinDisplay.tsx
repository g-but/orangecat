'use client';

import { useState } from 'react';
import { convertBitcoinToAll, formatBitcoinDisplay, formatSwissFrancs } from '@/services/currency';

interface BitcoinDisplayProps {
  usdAmount: number;
  className?: string;
}

// Mock exchange rate - in production this would come from an API
const BTC_USD_RATE = 105000; // 1 BTC = $105,000 USD

export default function BitcoinDisplay({ usdAmount, className = '' }: BitcoinDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  // Convert USD to Bitcoin, then get all conversions
  const bitcoinAmount = usdAmount / BTC_USD_RATE;
  const conversion = convertBitcoinToAll(bitcoinAmount);

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
