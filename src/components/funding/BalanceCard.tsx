'use client'

import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface BalanceCardProps {
  balance: number
  isLoading: boolean
  onRefresh: () => void
}

export function BalanceCard({ balance, isLoading, onRefresh }: BalanceCardProps) {
  // Format balance in a reader-friendly way
  const formatBalance = (btc: number) => {
    if (btc === 0) {return '0.00000000 BTC'}
    
    // If balance is less than 0.01 BTC, show 8 decimal places
    if (btc < 0.01) {
      return `${btc.toFixed(8)} BTC`
    }
    
    // If balance is less than 1 BTC, show 6 decimal places
    if (btc < 1) {
      return `${btc.toFixed(6)} BTC`
    }
    
    // If balance is less than 100 BTC, show 4 decimal places
    if (btc < 100) {
      return `${btc.toFixed(4)} BTC`
    }
    
    // For larger amounts, show 2 decimal places
    return `${btc.toFixed(2)} BTC`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Current Balance</h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`p-2 rounded-full transition-colors ${
            isLoading
              ? 'bg-gray-100 text-gray-400'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="text-center">
        {isLoading ? (
          <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
        ) : (
          <p className="text-3xl font-bold text-gray-900">
            {formatBalance(balance)}
          </p>
        )}
      </div>
    </motion.div>
  )
} 