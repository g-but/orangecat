'use client'

import { motion } from 'framer-motion'
import { BitcoinTransaction } from '@/types/bitcoin/index'
import { TransactionCard } from './TransactionCard'

interface TransactionsListProps {
  transactions: BitcoinTransaction[]
  isLoading: boolean
}

export function TransactionsList({ transactions, isLoading }: TransactionsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p>No transactions found for this wallet address.</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {transactions.map((tx) => (
        <TransactionCard key={tx.txid} transaction={tx} />
      ))}
    </motion.div>
  )
} 