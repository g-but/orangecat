'use client';

import { logger } from '@/utils/logger';
import { useEffect, useState } from 'react';
import { Bitcoin, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import {
  getAddressBalance,
  getAddressTransactions,
  processTransactions,
  formatSats,
  type TransactionSummary,
} from '@/services/mempool';
import Button from '@/components/ui/Button';

interface BitcoinWalletStatsCompactProps {
  address: string;
  className?: string;
}

export default function BitcoinWalletStatsCompact({
  address,
  className = '',
}: BitcoinWalletStatsCompactProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [balanceResult, txsResult] = await Promise.all([
        getAddressBalance(address),
        getAddressTransactions(address, 5),
      ]);

      setBalance(balanceResult);

      if (txsResult.length > 0) {
        const processed = processTransactions(txsResult, address);
        setTransactions(processed);
      }
    } catch (err) {
      setError('Failed to load wallet data');
      logger.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg p-4 border border-gray-200 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  if (error || balance === null) {
    return (
      <div className={`bg-white rounded-lg p-4 border border-gray-200 ${className}`}>
        <div className="text-center text-gray-500 py-2">
          <p className="text-sm mb-2">Unable to load wallet data</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalReceived = transactions
    .filter(tx => tx.type === 'received')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const hasTransactions = transactions.length > 0;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Balance Display */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Bitcoin className="w-4 h-4" />
            <span className="text-xs font-medium">Balance</span>
          </div>
          <button
            onClick={fetchData}
            className="text-white/80 hover:text-white transition-colors p-1"
            aria-label="Refresh balance"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <div className="text-xl font-bold">{formatSats(balance)}</div>
        {totalReceived > 0 && (
          <div className="text-xs opacity-80 mt-0.5">
            Total received: {formatSats(totalReceived)}
          </div>
        )}
      </div>

      {/* Transaction Summary */}
      {hasTransactions ? (
        <div className="p-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Recent Activity
          </h4>

          <div className="space-y-2">
            {transactions.slice(0, 3).map(tx => (
              <div
                key={tx.txid}
                className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  {tx.type === 'received' ? (
                    <TrendingDown className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingUp className="w-3 h-3 text-red-600" />
                  )}
                  <span
                    className={`font-medium text-xs ${
                      tx.type === 'received' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'received' ? '+' : '-'}
                    {formatSats(tx.amount)}
                  </span>
                  {!tx.confirmed && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                      Pending
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {tx.timestamp
                    ? new Date(tx.timestamp * 1000).toLocaleDateString()
                    : 'Unconfirmed'}
                </div>
              </div>
            ))}
          </div>

          {transactions.length > 3 && (
            <div className="mt-3 text-center">
              <span className="text-xs text-gray-500">
                +{transactions.length - 3} more transactions
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          <p className="text-xs">No transactions yet</p>
        </div>
      )}
    </div>
  );
}
