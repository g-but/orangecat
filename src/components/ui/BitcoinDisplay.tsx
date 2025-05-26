'use client'

import { useState } from 'react'
import { convertUSDToBitcoin, formatBitcoinDisplay, formatTooltipDisplay } from '@/utils/bitcoin'

interface BitcoinDisplayProps {
  usdAmount: number
  className?: string
}

export default function BitcoinDisplay({ usdAmount, className = '' }: BitcoinDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const conversion = convertUSDToBitcoin(usdAmount)

  return (
    <div 
      className={`relative inline-block cursor-help ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="font-semibold">
        {formatBitcoinDisplay(conversion)}
      </span>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
          {formatTooltipDisplay(conversion)}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
} 