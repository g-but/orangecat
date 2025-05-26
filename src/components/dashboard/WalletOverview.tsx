'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Bitcoin, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ExternalLink
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useBitcoinWallet } from '@/hooks/useBitcoinWallet'
import { BitcoinTransaction } from '@/types/bitcoin'
import { getTransactionUrl } from '@/services/bitcoin'

interface WalletOverviewProps {
  walletAddress?: string | null
  className?: string
}

// Transaction status formatting
const getTransactionStatus = (status: string, timestamp: number) => {
  if (status === 'confirmed') {
    return { label: 'Confirmed', color: 'text-green-600', bgColor: 'bg-green-100' }
  }
  if (status === 'pending') {
    return { label: 'Pending', color: 'text-orange-600', bgColor: 'bg-orange-100' }
  }
  return { label: 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-100' }
}

// Format Bitcoin amount
const formatBitcoinAmount = (amount: number) => {
  return amount.toFixed(8)
}

// Format transaction value with color
const formatTransactionValue = (transaction: BitcoinTransaction) => {
  const sign = transaction.type === 'incoming' ? '+' : '-'
  const color = transaction.type === 'incoming' ? 'text-green-600' : 'text-red-600'
  return {
    display: `${sign}₿${formatBitcoinAmount(transaction.value)}`,
    color
  }
}

// Get Mempool.space address URL
const getAddressUrl = (address: string): string => {
  return `https://mempool.space/address/${address}`
}

export function WalletOverview({ walletAddress, className = '' }: WalletOverviewProps) {
  const { walletData, isLoading: walletLoading, error: walletError, refresh: refreshWallet } = useBitcoinWallet(
    walletAddress || ''
  )

  const hasWalletAddress = Boolean(walletAddress)

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Current Balance */}
      <Card className="lg:col-span-1 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center">
              <Bitcoin className="w-6 h-6 mr-2" />
              Current Balance
            </div>
            <div className="flex items-center gap-2">
              {hasWalletAddress && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(getAddressUrl(walletAddress!), '_blank')}
                    className="text-white hover:bg-white/20 p-2"
                    aria-label="View on Mempool.space"
                    title="View on Mempool.space"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshWallet}
                    disabled={walletLoading}
                    className="text-white hover:bg-white/20 p-2"
                    aria-label="Refresh balance"
                  >
                    <RefreshCw className={`w-4 h-4 ${walletLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!hasWalletAddress ? (
            <div className="text-center py-4">
              <p className="text-orange-100 text-sm mb-3">Add a Bitcoin address to see your balance</p>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="border-white text-orange-600 bg-white hover:bg-orange-50">
                  Add Bitcoin Address
                </Button>
              </Link>
            </div>
          ) : walletError ? (
            <div className="text-center py-4">
              <p className="text-orange-100 text-sm mb-2">Unable to load balance</p>
              <p className="text-orange-200 text-xs">{walletError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshWallet}
                className="border-white text-orange-600 bg-white hover:bg-orange-50 mt-3"
              >
                Retry
              </Button>
            </div>
          ) : walletLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-orange-100 text-sm">Loading balance...</p>
            </div>
          ) : (
            <div>
              <p className="text-3xl font-bold mb-2">
                ₿{formatBitcoinAmount(walletData?.balance || 0)}
              </p>
              <p className="text-orange-100 text-sm mb-3">
                Last updated: {walletData?.lastUpdated ? new Date(walletData.lastUpdated).toLocaleTimeString() : 'Never'}
              </p>
              <div className="flex items-center text-orange-200 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                <span>Data from Mempool.space</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-orange-600" />
              Recent Transactions
            </div>
            {hasWalletAddress && walletData?.transactions && walletData.transactions.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getAddressUrl(walletAddress!), '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View on Mempool
                </Button>
                <Link href="/profile/me">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View All
                  </Button>
                </Link>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Your latest Bitcoin transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasWalletAddress ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-3">Add a Bitcoin address to see transactions</p>
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  Set Up Wallet
                </Button>
              </Link>
            </div>
          ) : walletError ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
              <p className="text-red-600 mb-2">Unable to load transactions</p>
              <p className="text-gray-500 text-sm mb-4">{walletError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshWallet}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : walletLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-3 border border-gray-100 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : !walletData?.transactions || walletData.transactions.length === 0 ? (
            <div className="text-center py-8">
              <Bitcoin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found</p>
              <p className="text-gray-400 text-sm mt-1">Transactions will appear here once you start using Bitcoin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {walletData.transactions.slice(0, 5).map((tx) => {
                const statusInfo = getTransactionStatus(tx.status, tx.timestamp)
                const valueInfo = formatTransactionValue(tx)
                
                return (
                  <div key={tx.txid} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${tx.type === 'incoming' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {tx.type === 'incoming' ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {tx.type === 'incoming' ? 'Received' : 'Sent'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(tx.timestamp).toLocaleDateString()} at {new Date(tx.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className={`font-medium ${valueInfo.color}`}>
                            {valueInfo.display}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getTransactionUrl(tx.txid), '_blank')}
                          className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="View transaction on Mempool.space"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {walletData.transactions.length > 5 && (
                <div className="text-center pt-4 border-t border-gray-100">
                  <div className="flex justify-center gap-3">
                    <Link href="/profile/me">
                      <Button variant="outline" size="sm">
                        View All {walletData.transactions.length} Transactions
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getAddressUrl(walletAddress!), '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Mempool.space
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 