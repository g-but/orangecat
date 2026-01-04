/**
 * Loan Dialog Validation
 *
 * Zod validation schema for loan form.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created loan dialog validation schema
 */

import * as z from 'zod';
import { CURRENCY_CODES, DEFAULT_CURRENCY } from '@/config/currencies';

export const loanSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    loan_category_id: z.string().optional(),
    original_amount: z.number().min(0.01, 'Amount must be greater than 0'),
    remaining_balance: z.number().min(0.01, 'Balance must be greater than 0'),
    interest_rate: z.number().min(0).max(100).optional(),
    monthly_payment: z.number().min(0).optional(),
    currency: z.enum(CURRENCY_CODES).default(DEFAULT_CURRENCY),
    lender_name: z.string().optional(),
    loan_number: z.string().optional(),
    origination_date: z.string().optional(),
    maturity_date: z.string().optional(),
    is_public: z.boolean().default(true),
    is_negotiable: z.boolean().default(true),
    minimum_offer_amount: z.number().min(0).optional(),
    preferred_terms: z.string().optional(),
    contact_method: z.enum(['platform', 'email', 'phone']).default('platform'),
  })
  .refine(data => data.remaining_balance <= data.original_amount, {
    message: 'Remaining balance cannot exceed original amount',
    path: ['remaining_balance'],
  });

export type LoanFormData = z.infer<typeof loanSchema>;


