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

export interface LoanFormData {
  title: string;
  description?: string;
  loan_category_id?: string;
  original_amount: number;
  remaining_balance: number;
  interest_rate?: number;
  monthly_payment?: number;
  currency: string;
  lender_name?: string;
  loan_number?: string;
  origination_date?: string;
  maturity_date?: string;
  is_public: boolean;
  is_negotiable: boolean;
  minimum_offer_amount?: number;
  preferred_terms?: string;
  contact_method: 'platform' | 'email' | 'phone';
}

export interface AssetOption {
  id: string;
  title: string;
  estimated_value: number | null;
  currency: string;
  verification_status: string;
}


