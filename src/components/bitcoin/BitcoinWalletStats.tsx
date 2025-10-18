'use client'

import { useEffect, useState } from 'react'
import { Bitcoin, TrendingUp, ArrowUpRight, ArrowDownRight, ExternalLink, RefreshCw } from 'lucide-react'
import {
  getAddressBalance,
  getAddressTransactions,
  processTransactions,
  formatSats,
  getTxUrl,
  type TransactionSummary
} from '@/services/mempool'
import Button from '@/components/ui/Button'

interface BitcoinWalletStatsProps {
  address: string
  className?: string
}

export default function BitcoinWalletStats({ address, className = '' }: BitcoinWalletStatsProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<TransactionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch balance and transactions in parallel
      const [balanceResult, txsResult] = await Promise.all([
        getAddressBalance(address),
        getAddressTransactions(address, 5)
      ])

      setBalance(balanceResult)

      if (txsResult.length > 0) {
        const processed = processTransactions(txsResult, address)
        setTransactions(processed)
      }
    } catch (err) {
      setError('Failed to load wallet data')
      console.error('Error fetching wallet data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (address) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-md border border-orange-100 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  if (error || balance === null) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-md border border-orange-100 ${className}`}>
        <div className="text-center text-gray-500 py-4">
          <p className="text-sm">Unable to load wallet data</p>
          <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const totalReceived = transactions
    .filter(tx => tx.type === 'received')
    .reduce((sum, tx) => sum + tx.amount, 0)

  return (
    <div className={`bg-white rounded-xl shadow-md border border-orange-100 overflow-hidden ${className}`}>
      {/* Balance Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bitcoin className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Current Balance</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-3xl font-bold">
          {formatSats(balance)}
        </div>
        {totalReceived > 0 && (
          <div className="text-sm opacity-90 mt-1">
            Total received: {formatSats(totalReceived)}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Recent Transactions
          </h4>

          <div className="space-y-3">
            {transactions.map((tx) => (
              <a
                key={tx.txid}
                href={getTxUrl(tx.txid)}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {tx.type === 'received' ? (
                        <ArrowDownRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`font-semibold ${
                        tx.type === 'received' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'received' ? '+' : '-'}{formatSats(tx.amount)}
                      </span>
                      {!tx.confirmed && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-500 font-mono">
                        {tx.txid.slice(0, 8)}...{tx.txid.slice(-8)}
                      </code>
                      <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {tx.timestamp ? (
                      <div>
                        {new Date(tx.timestamp * 1000).toLocaleDateString()}
                        <div className="text-gray-400">
                          {new Date(tx.timestamp * 1000).toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-yellow-600">Unconfirmed</div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {transactions.length === 0 && balance === 0 && (
        <div className="p-6 text-center text-gray-500">
          <p className="text-sm">No transactions yet</p>
        </div>
      )}
    </div>
  )
}
