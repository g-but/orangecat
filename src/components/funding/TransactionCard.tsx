'use client'

import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ExternalLink, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react'
import { BitcoinTransaction } from '@/types/bitcoin'
import { getTransactionUrl } from '@/services/bitcoin'
import { formatDistanceToNow } from 'date-fns'

interface TransactionCardProps {
  transaction: BitcoinTransaction
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {transaction.type === 'incoming' ? (
              <ArrowDown className="h-5 w-5 text-green-500" />
            ) : (
              <ArrowUp className="h-5 w-5 text-red-500" />
            )}
            <p className="font-medium text-gray-900">
              {transaction.type === 'incoming' ? '+' : '-'}{transaction.value.toFixed(8)} BTC
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formatDistanceToNow(transaction.timestamp, { addSuffix: true })}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              transaction.status === 'confirmed'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {transaction.status}
          </span>
          <a
            href={getTransactionUrl(transaction.txid)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-4 border-t border-gray-100 pt-3">
        <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm">Like</span>
        </button>
        <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
          <ThumbsDown className="h-4 w-4" />
          <span className="text-sm">Dislike</span>
        </button>
        <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm">Comment</span>
        </button>
      </div>
    </motion.div>
  )
} 