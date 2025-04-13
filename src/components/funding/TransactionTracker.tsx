'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import { Loader2 } from 'lucide-react'

interface TransactionTrackerProps {
  fundingPageId: string
}

export default function TransactionTracker({ fundingPageId }: TransactionTrackerProps) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadTransactions = async () => {
    try {
      const { data, error } = await createClientComponentClient()
        .from('transactions')
        .select('*')
        .eq('funding_page_id', fundingPageId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data)
    } catch (err) {
      console.error('Error loading transactions:', err)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadTransactions()
    }
  }, [user, loadTransactions])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-tiffany-500" />
      </div>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
      {transactions.length === 0 ? (
        <p className="text-gray-500">No transactions yet</p>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{transaction.amount} sats</p>
                <p className="text-sm text-gray-500">
                  {new Date(transaction.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {transaction.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
} 