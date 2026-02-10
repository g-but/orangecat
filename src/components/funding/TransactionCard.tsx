'use client';

import { motion } from 'framer-motion';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
} from 'lucide-react';
import { BitcoinTransaction } from '@/types/bitcoin/index';
import { getTransactionUrl, formatBtcValue } from '@/services/bitcoin';
import { formatDistanceToNow } from 'date-fns';

interface TransactionCardProps {
  transaction: BitcoinTransaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const isIncoming = transaction.type === 'incoming';
  const valueInSats = transaction.value * 100000000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300 ease-in-out"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div
            className={`flex items-center space-x-2.5 ${isIncoming ? 'text-green-600' : 'text-red-600'}`}
          >
            {isIncoming ? (
              <ArrowDownCircle className="h-6 w-6 stroke-[1.5px]" />
            ) : (
              <ArrowUpCircle className="h-6 w-6 stroke-[1.5px]" />
            )}
            <div>
              <p className="font-semibold text-lg text-gray-800">
                {isIncoming ? 'Received' : 'Sent'} {formatBtcValue(valueInSats)} BTC
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-1">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${
              transaction.status === 'confirmed'
                ? 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20'
                : 'bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
            }`}
          >
            {transaction.status}
          </span>
          <a
            href={getTransactionUrl(transaction.txid)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-tiffany-600 hover:text-tiffany-700 transition-colors duration-200 text-xs flex items-center"
          >
            View Details <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-4 border-t border-gray-200 pt-3 opacity-50 cursor-not-allowed">
        <button disabled className="flex items-center space-x-1 text-gray-400">
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm">Like</span>
        </button>
        <button disabled className="flex items-center space-x-1 text-gray-400">
          <ThumbsDown className="h-4 w-4" />
          <span className="text-sm">Dislike</span>
        </button>
        <button disabled className="flex items-center space-x-1 text-gray-400">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm">Comment</span>
        </button>
      </div>
    </motion.div>
  );
}
