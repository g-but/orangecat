/**
 * Loan Dialog Types
 *
 * Type definitions for CreateLoanDialog component.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created loan dialog type definitions
 */

import type { Loan } from '@/types/loans';

export interface CreateLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoanCreated?: () => void;
  onLoanUpdated?: () => void;
  mode?: 'create' | 'edit';
  loanId?: string;
  initialValues?: Partial<Loan>;
}

export interface AssetOption {
  id: string;
  title: string;
  estimated_value: number | null;
  currency: string;
  verification_status: string;
}


