import EntityDetailPage from '@/components/entity/EntityDetailPage';
import { loanEntityConfig } from '@/config/entities/loans';
import type { Loan } from '@/types/loans';
import { formatDistanceToNow } from 'date-fns';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Loan Detail Page
 *
 * Unified detail page using EntityDetailPage component with custom loan-specific fields.
 *
 * Created: 2025-12-31
 * Last Modified: 2026-01-03
 * Last Modified Summary: Refactored to use unified EntityDetailPage component
 */
export default async function LoanDetailPage({ params }: PageProps) {
  const { id } = await params;

  function formatCurrency(amount: number, currency: string = 'USD') {
    if (currency === 'BTC') {
      return `${(amount / 100000000).toFixed(8)} BTC`;
    }
    if (currency === 'SATS') {
      return `${amount.toLocaleString()} SATS`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'EUR' ? 'EUR' : currency === 'CHF' ? 'CHF' : 'USD',
    }).format(amount);
  }

  function calculateProgress(original: number, remaining: number) {
    if (original === 0) {return 0;}
    return ((original - remaining) / original) * 100;
  }

  return (
    <EntityDetailPage<Loan>
      config={loanEntityConfig}
      entityId={id}
      requireAuth={true}
      redirectPath="/auth?mode=login&from=/dashboard/loans"
      makeDetailFields={(loan) => {
        const progress = calculateProgress(loan.original_amount, loan.remaining_balance);
        const paidAmount = loan.original_amount - loan.remaining_balance;

        const left = [
          {
            label: 'Status',
            value: (
              <Badge
                variant={loan.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {loan.status}
              </Badge>
            ),
          },
          {
            label: 'Original Amount',
            value: formatCurrency(loan.original_amount, loan.currency),
          },
          {
            label: 'Remaining Balance',
            value: formatCurrency(loan.remaining_balance, loan.currency),
          },
          {
            label: 'Progress',
            value: `${progress.toFixed(0)}% paid (${formatCurrency(paidAmount, loan.currency)})`,
          },
        ];

        if (loan.interest_rate) {
          left.push({
            label: 'Interest Rate',
            value: `${loan.interest_rate}% APR`,
          });
        }

        if (loan.loan_type) {
          left.push({
            label: 'Loan Type',
            value:
              loan.loan_type === 'new_request'
                ? 'New Loan Request'
                : 'Existing Loan Refinancing',
          });
        }

        if (loan.loan_category_id) {
          left.push({
            label: 'Category',
            value: loan.loan_category_id.replace('_', ' '),
          });
        }

        if (loan.fulfillment_type) {
          left.push({
            label: 'Fulfillment',
            value: loan.fulfillment_type,
          });
        }

        // Existing loan details (if refinancing)
        if (loan.loan_type === 'existing_loan') {
          if (loan.current_lender) {
            left.push({
              label: 'Current Lender',
              value: loan.current_lender,
            });
          }
          if (loan.current_interest_rate) {
            left.push({
              label: 'Current Rate',
              value: `${loan.current_interest_rate}%`,
            });
          }
          if (loan.monthly_payment) {
            left.push({
              label: 'Monthly Payment',
              value: formatCurrency(loan.monthly_payment, loan.currency),
            });
          }
          if (loan.desired_rate) {
            left.push({
              label: 'Desired Rate',
              value: `${loan.desired_rate}%`,
            });
          }
        }

        const right: Array<{ label: string; value: string }> = [];

        if (loan.bitcoin_address) {
          right.push({
            label: 'Bitcoin Address',
            value: loan.bitcoin_address,
          });
        }

        if (loan.lightning_address) {
          right.push({
            label: 'Lightning Address',
            value: loan.lightning_address,
          });
        }

        if (loan.created_at) {
          right.push({
            label: 'Created',
            value: `${formatDistanceToNow(new Date(loan.created_at), { addSuffix: true })} (${new Date(loan.created_at).toLocaleString()})`,
          });
        }

        if (loan.updated_at) {
          right.push({
            label: 'Updated',
            value: new Date(loan.updated_at).toLocaleString(),
          });
        }

        return { left, right };
      }}
    />
  );
}
