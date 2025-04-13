'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getTransactions, addTransaction } from '@/lib/supabase'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import { Loader2, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TransactionTrackerProps {
  fundingPageId: string
  isOwner?: boolean
  onBalanceUpdate?: (balance: number) => void
}

export default function TransactionTracker({ 
  fundingPageId, 
  isOwner = false,
  onBalanceUpdate 
}: TransactionTrackerProps) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()
  }, [fundingPageId])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const data = await getTransactions(fundingPageId)
      setTransactions(data)
      
      // Calculate total balance
      const balance = data.reduce((sum, tx) => {
        return tx.status === 'confirmed' ? sum + Number(tx.amount) : sum
      }, 0)
      
      onBalanceUpdate?.(balance)
    } catch (err) {
      console.error('Error loading transactions:', err)
      setError('Failed to load transactions')
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await loadTransactions()
      toast.success('Transactions refreshed')
    } catch (err) {
      console.error('Error refreshing transactions:', err)
      toast.error('Failed to refresh transactions')
    } finally {
      setRefreshing(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No transactions yet
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-sm font-mono">
                  {tx.transaction_hash.slice(0, 8)}...{tx.transaction_hash.slice(-8)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatAmount(tx.amount)}</div>
                {isOwner && tx.status === 'pending' && (
                  <button
                    onClick={() => {/* TODO: Implement manual confirmation */}}
                    className="text-xs text-primary hover:underline"
                  >
                    Confirm
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
} 