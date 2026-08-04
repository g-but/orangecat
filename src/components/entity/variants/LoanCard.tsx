/**
 * Loan Card Component for Discover/Browse Pages
 *
 * Displays loan information in a card format for discovery.
 * Consistent with ProjectCard and ProfileCard patterns.
 *
 * Created: 2025-12-31
 */

'use client';

import Link from 'next/link';
import { DollarSign, Percent, TrendingUp, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EntityCard } from '@/components/entity/EntityCard';
import { formatRelativeTime } from '@/utils/dates';
import type { Loan } from '@/types/loans';
import { STATUS } from '@/config/database-constants';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { formatCurrency as formatCurrencyFn } from '@/services/currency';
import { calculateProgress } from '@/components/loans/useLoanList';

interface LoanCardProps {
  loan: Loan;
  viewMode?: 'grid' | 'list';
}

export function LoanCard({ loan, viewMode = 'grid' }: LoanCardProps) {
  const formatAmount = (amount: number, currency: string = 'USD') =>
    formatCurrencyFn(amount, currency);

  const progress = calculateProgress(loan.original_amount, loan.remaining_balance);

  if (viewMode === 'list') {
    return (
      <Link href={`${ENTITY_REGISTRY['loan'].publicBasePath}/${loan.id}`}>
        <Card className="oc-card-link">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            {/* Icon */}
            <div className="oc-icon-tile h-12 w-12">
              <DollarSign className="w-6 h-6 text-fg-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-fg-primary truncate">{loan.title}</h3>
              <p className="text-sm text-fg-secondary truncate">
                {formatAmount(loan.remaining_balance, loan.currency ?? undefined)} remaining
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-2 text-sm sm:justify-end">
              {loan.interest_rate && (
                <Badge variant="secondary" className="gap-1">
                  <Percent className="h-3 w-3" />
                  {loan.interest_rate}%
                </Badge>
              )}
              <span className="text-fg-secondary">{formatRelativeTime(loan.created_at)}</span>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <EntityCard
      id={loan.id}
      title={loan.title}
      description={loan.description}
      href={`${ENTITY_REGISTRY['loan'].publicBasePath}/${loan.id}`}
      headerSlot={
        <Badge
          variant={loan.status === STATUS.LOANS.ACTIVE ? 'default' : 'secondary'}
          className="text-xs capitalize"
        >
          {loan.status}
        </Badge>
      }
      progressSlot={
        <div className="space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-fg-secondary">Remaining</span>
            <span className="break-words font-semibold text-fg-primary sm:text-right">
              {formatAmount(loan.remaining_balance, loan.currency ?? undefined)}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex flex-col gap-1 text-xs text-fg-secondary sm:flex-row sm:justify-between">
            <span>{progress.toFixed(0)}% funded</span>
            <span className="break-words sm:text-right">
              {formatAmount(loan.original_amount, loan.currency ?? undefined)} total
            </span>
          </div>
        </div>
      }
      metricsSlot={
        loan.interest_rate || loan.monthly_payment ? (
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
            {loan.interest_rate && (
              <div className="flex items-center gap-1">
                <Percent className="h-3 w-3 text-fg-tertiary" />
                <span>{loan.interest_rate}% APR</span>
              </div>
            )}
            {loan.monthly_payment && (
              <div className="flex min-w-0 items-center gap-1">
                <TrendingUp className="h-3 w-3 text-fg-tertiary" />
                <span className="min-w-0 break-words">
                  {formatAmount(loan.monthly_payment, loan.currency ?? undefined)}/mo
                </span>
              </div>
            )}
          </div>
        ) : null
      }
      footerSlot={
        loan.lender_name ? (
          <div className="flex items-center gap-2 text-xs text-fg-secondary">
            <User className="h-3 w-3" />
            <span className="truncate">Current lender: {loan.lender_name}</span>
          </div>
        ) : null
      }
    />
  );
}

export default LoanCard;
