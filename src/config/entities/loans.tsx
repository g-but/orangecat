/**
 * Loan Entity Configuration
 * 
 * Created: 2025-12-31
 * Last Modified: 2025-12-31
 * Last Modified Summary: Initial creation of loan entity configuration for modular entity system
 */

import { EntityConfig } from '@/types/entity';
import { Loan } from '@/types/loans';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { DollarSign } from 'lucide-react';

export const loanEntityConfig: EntityConfig<Loan> = {
  name: 'Loan',
  namePlural: 'Loans',
  colorTheme: 'tiffany',
  
  listPath: '/dashboard/loans',
  detailPath: (id) => `/dashboard/loans/${id}`,
  createPath: '/dashboard/loans/create',
  editPath: (id) => `/dashboard/loans/create?edit=${id}`,
  
  apiEndpoint: '/api/loans',
  
  makeHref: (loan) => `/dashboard/loans/${loan.id}`,
  
  makeCardProps: (loan) => {
    // Build remaining balance label
    const balanceLabel = loan.remaining_balance
      ? `${loan.remaining_balance.toLocaleString()} ${loan.currency || 'USD'} remaining`
      : undefined;

    // Build metadata parts
    const metadataParts: string[] = [];
    if (loan.interest_rate) {
      metadataParts.push(`${loan.interest_rate}% interest`);
    }
    if (loan.loan_category_id) {
      metadataParts.push(loan.loan_category_id.replace('_', ' '));
    }
    if (loan.status) {
      metadataParts.push(loan.status.replace('_', ' '));
    }

    // Calculate progress percentage
    const progress = loan.original_amount > 0
      ? Math.round(((loan.original_amount - loan.remaining_balance) / loan.original_amount) * 100)
      : 0;

    return {
      priceLabel: balanceLabel,
      badge: loan.status === 'active' ? 'Active' :
             loan.status === 'paid_off' ? 'Paid Off' :
             loan.status === 'refinanced' ? 'Refinanced' :
             loan.status === 'defaulted' ? 'Defaulted' :
             loan.status === 'draft' ? 'Draft' : undefined,
      badgeVariant: loan.status === 'active' ? 'success' :
                    loan.status === 'paid_off' ? 'success' :
                    loan.status === 'refinanced' ? 'default' :
                    loan.status === 'defaulted' ? 'destructive' :
                    loan.status === 'draft' ? 'default' : 'default',
      metadata: metadataParts.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {metadataParts.map((part, idx) => (
            <span key={idx} className="capitalize">
              {part}
            </span>
          ))}
          {progress > 0 && (
            <span className="text-tiffany-600 font-medium">
              {progress}% paid
            </span>
          )}
        </div>
      ) : undefined,
      showEditButton: true,
      editHref: `/dashboard/loans/create?edit=${loan.id}`,
    };
  },
  
  emptyState: {
    title: 'No loans yet',
    description: 'Add your first loan to start receiving refinancing offers from the community.',
    action: (
      <Link href="/dashboard/loans/create">
        <Button className="bg-gradient-to-r from-tiffany-600 to-tiffany-700">
          Add Loan
        </Button>
      </Link>
    ),
  },
  
  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
