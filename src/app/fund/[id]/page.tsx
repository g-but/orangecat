'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Loader2 } from 'lucide-react'
import TransactionTracker from '@/components/funding/TransactionTracker'
import BalanceSummary from '@/components/funding/BalanceSummary'
import { formatDistanceToNow } from 'date-fns'

export default function FundingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState('')

  const loadPage = async () => {
    try {
      const { data, error } = await createClientComponentClient()
        .from('funding_pages')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setPage(data)
    } catch (err) {
      console.error('Error loading page:', err)
      toast.error('Failed to load funding page')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadPage()
    }
  }, [user, loadPage])

  const handleBalanceUpdate = (newBalance: number) => {
    setBalance(newBalance)
    setLastUpdated(formatDistanceToNow(new Date(), { addSuffix: true }))
  }

  const handlePendingUpdate = (transactions: any[]) => {
    const pending = transactions
      .filter(tx => tx.status === 'pending')
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    setPendingAmount(pending)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-tiffany-500" />
      </div>
    )
  }

  if (!page) {
    return (
      <div className="text-center text-red-500 p-4">
        Funding page not found
      </div>
    )
  }

  const isOwner = user?.id === page.user_id

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{page.title}</h1>
            <p className="text-gray-500 mt-1">{page.description}</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full ${
              page.is_verified 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {page.is_verified ? 'Verified' : 'Unverified'}
            </span>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/fund/${params.id}/edit`)}
              >
                Edit Page
              </Button>
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Bitcoin Address</h2>
            <div className="bg-gray-50 p-4 rounded-lg font-mono break-all">
              {page.bitcoin_address}
            </div>
          </div>
        </div>
      </Card>

      <BalanceSummary
        balance={balance}
        pendingAmount={pendingAmount}
        lastUpdated={lastUpdated}
      />

      <TransactionTracker
        fundingPageId={params.id}
        isOwner={isOwner}
        onBalanceUpdate={handleBalanceUpdate}
      />
    </div>
  )
} 