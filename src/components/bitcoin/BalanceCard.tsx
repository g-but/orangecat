'use client'

import { motion } from 'framer-motion'
import { Bitcoin, RefreshCw } from 'lucide-react'
import { formatBtcValue } from '@/services/bitcoin'

interface BalanceCardProps {
  balance: number
  lastUpdated: number
  isLoading?: boolean
  onRefresh?: () => void
}

export function BalanceCard({ balance, lastUpdated, isLoading = false, onRefresh }: BalanceCardProps) {
  const formattedBalance = formatBtcValue(balance)
  const updatedTime = new Date(lastUpdated).toLocaleTimeString()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card bg-gradient-to-br from-tiffany/10 to-tiffany/5 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center">
          <Bitcoin className="w-5 h-5 mr-2 text-tiffany" />
          Current Balance
        </h3>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-full text-slate-500 hover:text-tiffany transition-colors disabled:opacity-50"
            aria-label="Refresh balance"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      
      <div className="text-center py-4">
        <div className="text-4xl font-bold text-tiffany mb-2">
          {isLoading ? (
            <div className="h-10 w-48 mx-auto rounded-md bg-slate-200 animate-pulse"></div>
          ) : (
            <>{formattedBalance} BTC</>
          )}
        </div>
        <p className="text-sm text-slate-500">
          {isLoading ? 'Updating...' : `Last updated: ${updatedTime}`}
        </p>
      </div>
    </motion.div>
  )
} 