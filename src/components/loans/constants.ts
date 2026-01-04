/**
 * Loan Dialog Constants
 *
 * Constants and default values for CreateLoanDialog.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created loan dialog constants
 */

import { DEFAULT_CURRENCY } from '@/config/currencies';
import type { LoanFormData } from './validation';

export const DEFAULT_LOAN_FORM_VALUES: LoanFormData = {
  title: '',
  description: '',
  original_amount: 0,
  remaining_balance: 0,
  currency: DEFAULT_CURRENCY,
  is_public: true,
  is_negotiable: true,
  contact_method: 'platform',
  minimum_offer_amount: undefined,
  interest_rate: undefined,
  monthly_payment: undefined,
  lender_name: '',
  loan_number: '',
  origination_date: '',
  maturity_date: '',
  preferred_terms: '',
  loan_category_id: '',
};

export const CONTACT_METHODS = [
  { value: 'platform', label: 'Through OrangeCat Platform' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
] as const;


