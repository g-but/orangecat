'use client';

import Link from 'next/link';
import {
  Bitcoin,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ExternalLink,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useBitcoinWallet } from '@/hooks/useBitcoinWallet';
import { BitcoinTransaction } from '@/types/bitcoin';
import { getTransactionUrl } from '@/services/bitcoin';

interface WalletOverviewProps {
  walletAddress?: string | null;
  className?: string;
}

// Transaction status formatting
const getTransactionStatus = (status: string, _timestamp: number) => {
  if (status === 'confirmed') {
    return { label: 'Confirmed', color: 'text-green-600', bgColor: 'bg-green-100' };
  }
  if (status === 'pending') {
    return { label: 'Pending', color: 'text-orange-600', bgColor: 'bg-orange-100' };
  }
  return { label: 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-100' };
};

// Format Bitcoin amount
const formatBitcoinAmount = (amount: number) => {
  return amount.toFixed(8);
};

// Format transaction value with color
const formatTransactionValue = (transaction: BitcoinTransaction) => {
  const sign = transaction.type === 'incoming' ? '+' : '-';
  const color = transaction.type === 'incoming' ? 'text-green-600' : 'text-red-600';
  return {
    display: `${sign}₿${formatBitcoinAmount(transaction.amount)}`,
    color,
  };
};

// Get Mempool.space address URL
const getAddressUrl = (address: string): string => {
  return `https://mempool.space/address/${address}`;
};

export function WalletOverview({ walletAddress, className = '' }: WalletOverviewProps) {
  const {
    walletData,
    isLoading: walletLoading,
    error: walletError,
    refresh: refreshWallet,
  } = useBitcoinWallet(walletAddress || '');

  const hasWalletAddress = Boolean(walletAddress);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 ${className}`}>
      {/* Current Balance */}
      <Card className="lg:col-span-1 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center min-w-0 flex-1">
              <Bitcoin className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base font-medium truncate">Current Balance</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 ml-2">
              {hasWalletAddress && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(getAddressUrl(walletAddress!), '_blank')}
                    className="text-white hover:bg-white/20 p-2 min-h-[44px] min-w-[44px] touch-manipulation"
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
                    className="text-white hover:bg-white/20 p-2 min-h-[44px] min-w-[44px] touch-manipulation"
                    aria-label="Refresh balance"
                  >
                    <RefreshCw className={`w-4 h-4 ${walletLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4 sm:pb-6">
          {!hasWalletAddress ? (
            <div className="text-center py-4 sm:py-6">
              <p className="text-orange-100 text-sm sm:text-base mb-3 sm:mb-4">
                Add a Bitcoin address to see your balance
              </p>
              <Link href="/profile">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white text-orange-600 bg-white hover:bg-orange-50 min-h-[44px] px-4 sm:px-6 touch-manipulation"
                >
                  Add Bitcoin Address
                </Button>
              </Link>
            </div>
          ) : walletError ? (
            <div className="text-center py-4 sm:py-6">
              <p className="text-orange-100 text-sm sm:text-base mb-2">Unable to load balance</p>
              <p className="text-orange-200 text-xs sm:text-sm mb-3 sm:mb-4 break-words">
                {walletError}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshWallet}
                className="border-white text-orange-600 bg-white hover:bg-orange-50 min-h-[44px] px-4 sm:px-6 touch-manipulation"
              >
                Retry
              </Button>
            </div>
          ) : walletLoading ? (
            <div className="text-center py-6 sm:py-8">
              <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2 sm:mb-3"></div>
              <p className="text-orange-100 text-sm sm:text-base">Loading balance...</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold break-all">
                ₿{formatBitcoinAmount(walletData?.balance || 0)}
              </p>
              <p className="text-orange-100 text-xs sm:text-sm">
                Last updated:{' '}
                {walletData?.lastUpdated
                  ? new Date(walletData.lastUpdated).toLocaleTimeString()
                  : 'Never'}
              </p>
              <div className="flex items-center text-orange-200 text-xs sm:text-sm">
                <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                <span>Data from Mempool.space</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center min-w-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600 flex-shrink-0" />
              <span className="text-base sm:text-lg font-semibold truncate">
                Recent Transactions
              </span>
            </div>
            {hasWalletAddress && walletData?.transactions && walletData.transactions.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getAddressUrl(walletAddress!), '_blank')}
                  className="min-h-[44px] px-3 sm:px-4 touch-manipulation"
                >
                  <ExternalLink className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="text-sm">View on Mempool</span>
                </Button>
                <Link href="/profiles/me">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto min-h-[44px] px-3 sm:px-4 touch-manipulation"
                  >
                    <Eye className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                    <span className="text-sm">View All</span>
                  </Button>
                </Link>
              </div>
            )}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Your latest Bitcoin transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {!hasWalletAddress ? (
            <div className="text-center py-6 sm:py-8">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">
                Add a Bitcoin address to see transactions
              </p>
              <Link href="/profile">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] px-4 sm:px-6 touch-manipulation"
                >
                  Set Up Wallet
                </Button>
              </Link>
            </div>
          ) : walletError ? (
            <div className="text-center py-6 sm:py-8">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-red-600 mb-2 text-sm sm:text-base font-medium">
                Unable to load transactions
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4 break-words">
                {walletError}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshWallet}
                className="min-h-[44px] px-4 sm:px-6 touch-manipulation"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : walletLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="animate-pulse flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="space-y-2 flex-shrink-0">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-12 sm:w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : !walletData?.transactions || walletData.transactions.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Bitcoin className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">No transactions found</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">
                Transactions will appear here once you start using Bitcoin
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {walletData.transactions.slice(0, 5).map((tx: any) => {
                const statusInfo = getTransactionStatus(tx.status, tx.timestamp);
                const valueInfo = formatTransactionValue(tx);

                return (
                  <div
                    key={tx.txid}
                    className="flex items-center justify-between p-3 sm:p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group touch-manipulation"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div
                        className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${tx.type === 'incoming' ? 'bg-green-100' : 'bg-red-100'}`}
                      >
                        {tx.type === 'incoming' ? (
                          <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                          {tx.type === 'incoming' ? 'Received' : 'Sent'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {new Date(tx.timestamp).toLocaleDateString()} at{' '}
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                        <div className="text-right">
                          <p
                            className={`font-medium text-sm sm:text-base ${valueInfo.color} break-all`}
                          >
                            {valueInfo.display}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color} whitespace-nowrap`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getTransactionUrl(tx.txid), '_blank')}
                          className="p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-opacity min-h-[32px] min-w-[32px] touch-manipulation"
                          title="View transaction on Mempool.space"
                        >
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {walletData.transactions.length > 5 && (
                <div className="text-center pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                    <Link href="/profiles/me" className="w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto min-h-[44px] px-4 sm:px-6 touch-manipulation"
                      >
                        View All {walletData.transactions.length} Transactions
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getAddressUrl(walletAddress!), '_blank')}
                      className="w-full sm:w-auto min-h-[44px] px-4 sm:px-6 touch-manipulation"
                    >
                      <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>Mempool.space</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
