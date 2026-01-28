'use client';

/**
 * FormattedAmount Component
 *
 * A client component for displaying amounts in the user's preferred currency.
 * Use this in server components where hooks aren't available.
 *
 * Created: 2026-01-28
 * Last Modified: 2026-01-28
 * Last Modified Summary: Created for server component currency display
 */

import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface FormattedAmountProps {
  sats: number;
  className?: string;
}

export function FormattedAmount({ sats, className }: FormattedAmountProps) {
  const { formatAmount } = useDisplayCurrency();

  return <span className={className}>{formatAmount(sats)}</span>;
}

export default FormattedAmount;
