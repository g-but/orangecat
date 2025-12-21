import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import EntityDetailLayout from '@/components/entity/EntityDetailLayout'
import Link from 'next/link'
import Button from '@/components/ui/Button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LoanDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) redirect('/auth?mode=login&from=/loans')

  const { data: loan, error } = await supabase
    .from('loans')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !loan) notFound()

  const headerActions = (
    <Link href={`/loans/create?edit=${loan.id}`}>
      <Button>Edit</Button>
    </Link>
  )

  return (
    <EntityDetailLayout
      title={loan.title}
      subtitle={loan.description || ''}
      headerActions={headerActions}
      left={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-gray-500">Status</div>
            <div className="font-medium">{loan.status}</div>
            {loan.original_amount && (
              <>
                <div className="text-gray-500">Original Amount</div>
                <div className="font-medium">{loan.original_amount} {loan.currency || 'SATS'}</div>
              </>
            )}
            {loan.remaining_balance !== undefined && (
              <>
                <div className="text-gray-500">Remaining Balance</div>
                <div className="font-medium">{loan.remaining_balance} {loan.currency || 'SATS'}</div>
              </>
            )}
            {loan.interest_rate !== null && loan.interest_rate !== undefined && (
              <>
                <div className="text-gray-500">Interest Rate</div>
                <div className="font-medium">{loan.interest_rate}%</div>
              </>
            )}
            {loan.loan_category_id && (
              <>
                <div className="text-gray-500">Category</div>
                <div className="font-medium">{loan.loan_category_id}</div>
              </>
            )}
            {loan.fulfillment_type && (
              <>
                <div className="text-gray-500">Fulfillment Type</div>
                <div className="font-medium">{loan.fulfillment_type}</div>
              </>
            )}
          </div>
          {(loan.bitcoin_address || loan.lightning_address) && (
            <div className="text-sm space-y-2">
              <div className="text-gray-500">Payment Addresses</div>
              {loan.bitcoin_address && (
                <div className="mt-1">
                  <span className="text-gray-500 text-xs">Bitcoin: </span>
                  <span className="font-mono text-xs break-all">{loan.bitcoin_address}</span>
                </div>
              )}
              {loan.lightning_address && (
                <div className="mt-1">
                  <span className="text-gray-500 text-xs">Lightning: </span>
                  <span className="font-mono text-xs break-all">{loan.lightning_address}</span>
                </div>
              )}
            </div>
          )}
        </div>
      }
      right={
        <div className="space-y-3 text-sm">
          <div className="text-gray-500">Created</div>
          <div className="font-medium">{new Date(loan.created_at).toLocaleString()}</div>
          {loan.updated_at && (
            <>
              <div className="text-gray-500">Updated</div>
              <div className="font-medium">{new Date(loan.updated_at).toLocaleString()}</div>
            </>
          )}
        </div>
      }
    />
  )
}


