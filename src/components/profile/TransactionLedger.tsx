'use client';

import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, MessageCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface Transaction {
  id: string;
  amount: number;
  timestamp: string;
  type: 'incoming' | 'outgoing';
  explanation?: string;
  likes: number;
  dislikes: number;
  comments: Comment[];
}

interface TransactionLedgerProps {
  transactions: Transaction[];
}

export function TransactionLedger({ transactions }: TransactionLedgerProps) {
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [activeReactions, setActiveReactions] = useState<Record<string, 'like' | 'dislike' | null>>(
    {}
  );

  const toggleComments = (transactionId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [transactionId]: !prev[transactionId],
    }));
  };

  const handleReaction = (transactionId: string, type: 'like' | 'dislike') => {
    setActiveReactions(prev => ({
      ...prev,
      [transactionId]: prev[transactionId] === type ? null : type,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Transaction History</h2>

      <div className="space-y-4">
        {transactions.map(transaction => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'incoming'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {transaction.type === 'incoming' ? (
                    <ArrowDown className="w-5 h-5" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">
                    {transaction.type === 'incoming' ? 'Received' : 'Sent'} {transaction.amount} BTC
                  </div>
                  <div className="text-sm text-slate-500">
                    {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  className={`flex items-center gap-1 transition-colors ${
                    activeReactions[transaction.id] === 'like'
                      ? 'text-tiffany'
                      : 'text-slate-500 hover:text-tiffany'
                  }`}
                  onClick={() => handleReaction(transaction.id, 'like')}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{transaction.likes}</span>
                </button>
                <button
                  className={`flex items-center gap-1 transition-colors ${
                    activeReactions[transaction.id] === 'dislike'
                      ? 'text-tiffany'
                      : 'text-slate-500 hover:text-tiffany'
                  }`}
                  onClick={() => handleReaction(transaction.id, 'dislike')}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>{transaction.dislikes}</span>
                </button>
                <button
                  className={`flex items-center gap-1 transition-colors ${
                    expandedComments[transaction.id]
                      ? 'text-tiffany'
                      : 'text-slate-500 hover:text-tiffany'
                  }`}
                  onClick={() => toggleComments(transaction.id)}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{transaction.comments.length}</span>
                </button>
              </div>
            </div>

            {transaction.explanation && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-600">{transaction.explanation}</p>
              </div>
            )}

            {expandedComments[transaction.id] && (
              <div className="mt-4 space-y-3">
                {transaction.comments.length > 0 ? (
                  transaction.comments.map(comment => (
                    <div key={comment.id} className="pl-4 border-l-2 border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{comment.author}</span>
                        <span className="text-sm text-slate-500">
                          {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-2">No comments yet</p>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
