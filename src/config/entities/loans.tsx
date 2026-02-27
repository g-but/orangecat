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
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { STATUS } from '@/config/database-constants';
import { ROUTES } from '@/config/routes';

export const loanEntityConfig: EntityConfig<Loan> = {
  name: 'Loan',
  namePlural: 'Loans',
  colorTheme: 'tiffany',

  listPath: '/dashboard/loans',
  detailPath: id => `/dashboard/loans/${id}`,
  createPath: '/dashboard/loans/create',
  editPath: id => `/dashboard/loans/create?edit=${id}`,

  apiEndpoint: '/api/loans',

  makeHref: loan => `/dashboard/loans/${loan.id}`,

  makeCardProps: loan => {
    // Build remaining balance label
    const balanceLabel = loan.remaining_balance
      ? `${loan.remaining_balance.toLocaleString()} ${loan.currency || PLATFORM_DEFAULT_CURRENCY} remaining`
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
    const progress =
      loan.original_amount > 0
        ? Math.round(((loan.original_amount - loan.remaining_balance) / loan.original_amount) * 100)
        : 0;

    return {
      priceLabel: balanceLabel,
      badge:
        loan.status === STATUS.LOANS.ACTIVE
          ? 'Active'
          : loan.status === STATUS.LOANS.PAID_OFF
            ? 'Paid Off'
            : loan.status === STATUS.LOANS.REFINANCED
              ? 'Refinanced'
              : loan.status === STATUS.LOANS.DEFAULTED
                ? 'Defaulted'
                : loan.status === STATUS.LOANS.CANCELLED
                  ? 'Cancelled'
                  : undefined,
      badgeVariant:
        loan.status === STATUS.LOANS.ACTIVE
          ? 'success'
          : loan.status === STATUS.LOANS.PAID_OFF
            ? 'success'
            : loan.status === STATUS.LOANS.REFINANCED
              ? 'default'
              : loan.status === STATUS.LOANS.DEFAULTED
                ? 'destructive'
                : loan.status === STATUS.LOANS.CANCELLED
                  ? 'warning'
                  : 'default',
      metadata:
        metadataParts.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {metadataParts.map((part, idx) => (
              <span key={idx} className="capitalize">
                {part}
              </span>
            ))}
            {progress > 0 && <span className="text-tiffany-600 font-medium">{progress}% paid</span>}
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
      <Link href={ROUTES.DASHBOARD.LOANS_CREATE}>
        <Button className="bg-gradient-to-r from-tiffany-600 to-tiffany-700">Add Loan</Button>
      </Link>
    ),
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
