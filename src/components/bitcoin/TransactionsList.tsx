'use client'

import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ExternalLink } from 'lucide-react'
import { BitcoinTransaction } from '@/types/bitcoin'
import { getTransactionUrl } from '@/services/bitcoin'
import { formatDistanceToNow } from 'date-fns'

interface TransactionsListProps {
  transactions: BitcoinTransaction[]
  isLoading?: boolean
}

export function TransactionsList({ transactions, isLoading = false }: TransactionsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 mt-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-slate-200 mr-3"></div>
              <div className="flex-1">
                <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 w-16 bg-slate-200 rounded"></div>
              </div>
              <div className="h-4 w-20 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="card text-center py-6 text-slate-500">
        <p>No transactions found for this wallet address.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-6">
      {transactions.map((tx, index) => (
        <motion.div
          key={tx.txid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="card hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === 'incoming' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {tx.type === 'incoming' ? (
                  <ArrowDown className="w-5 h-5" />
                ) : (
                  <ArrowUp className="w-5 h-5" />
                )}
              </div>
              <div className="ml-3">
                <div className="font-semibold">
                  {tx.type === 'incoming' ? 'Received' : 'Sent'} {tx.value.toFixed(8)} BTC
                </div>
                <div className="text-sm text-slate-500">
                  {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                </div>
              </div>
            </div>
            
            <a
              href={getTransactionUrl(tx.txid)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-tiffany transition-colors"
              aria-label="View transaction details"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
          
          <div className="mt-3 text-xs flex justify-between text-slate-500">
            <span>
              Status: <span className={`font-medium ${tx.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}`}>
                {tx.status === 'confirmed' ? 'Confirmed' : 'Pending'}
              </span>
            </span>
            <span className="font-mono">ID: {tx.txid.substring(0, 8)}...{tx.txid.substring(tx.txid.length - 8)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
} 