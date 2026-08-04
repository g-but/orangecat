/**
 * LOANS SYSTEM TYPES
 *
 * Comprehensive type definitions for the peer-to-peer lending and refinancing platform.
 * Enables users to list loans for refinancing and allows community lending.
 */

import type { z } from 'zod';
import { type CurrencyCode } from '@/config/currencies';
import type { OffsetPagination } from '@/types/pagination';
import type { loanSchema } from '@/lib/validation/finance';
import type { Database } from '@/types/database';
import type { LoanFulfillmentType, LoanType } from '@/config/loans';

type LoanRow = Database['public']['Tables']['loans']['Row'];
type LoanOfferRow = Database['public']['Tables']['loan_offers']['Row'];

// Mirrors `loans_status_check` in the baseline migration.
type LoanStatus = 'draft' | 'active' | 'paid_off' | 'refinanced' | 'defaulted' | 'cancelled';

type LoanOfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

type LoanOfferType = 'refinance' | 'payoff';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentType = 'monthly' | 'lump_sum' | 'refinance' | 'payoff';

// Use CurrencyCode directly from @/config/currencies instead of creating an alias

type ContactMethod = 'platform' | 'email' | 'phone';

export type PaymentMethod = 'bitcoin' | 'lightning' | 'bank_transfer' | 'card' | 'other';

// ==================== DATABASE TYPES ====================

export type LoanCategory = Database['public']['Tables']['loan_categories']['Row'];

/**
 * A `loans` row.
 *
 * Columns come straight from the generated schema; only the columns Postgres
 * stores as `text` under a CHECK constraint are narrowed to the app's unions,
 * since postgres-meta can't express a CHECK as a union. Those narrowings are
 * asserted in exactly one place — `narrowLoan()` in
 * `services/loans/queries/narrow.ts`, at the query boundary.
 */
export interface Loan
  extends Omit<LoanRow, 'status' | 'contact_method' | 'currency' | 'loan_type' | 'fulfillment_type'> {
  status: LoanStatus;
  contact_method: ContactMethod | null;
  currency: CurrencyCode | null;
  loan_type: LoanType | null;
  fulfillment_type: LoanFulfillmentType | null;
  // Index signature for BaseEntity compatibility
  [key: string]: unknown;
}

export interface LoanOffer extends Omit<LoanOfferRow, 'offer_type' | 'status'> {
  offer_type: LoanOfferType;
  status: LoanOfferStatus;
  profiles?: {
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
  loans?: {
    id: string;
    title?: string | null;
    remaining_balance?: number | null;
    interest_rate?: number | null;
    currency?: CurrencyCode | string | null;
    status?: string | null;
    user_id?: string | null;
  } | null;
}

interface LoanPayment {
  id: string;
  loan_id: string;
  offer_id?: string;
  amount: number;
  currency: CurrencyCode;
  payment_type: PaymentType;
  payer_id: string;
  recipient_id: string;
  transaction_id?: string;
  payment_method?: PaymentMethod;
  notes?: string;
  status: PaymentStatus;
  processed_at: string;
  created_at: string;
}

// ==================== FORM TYPES ====================

/**
 * Payload for creating a loan — derived from `loanSchema` (the Zod SSOT in
 * lib/validation/finance, which also validates POST/PUT /api/loans).
 * `z.input` keeps schema-defaulted fields (loan_type, fulfillment_type,
 * collateral) optional for callers, exactly as the API accepts them.
 */
export type CreateLoanRequest = z.input<typeof loanSchema>;

export type UpdateLoanRequest = Partial<CreateLoanRequest> & {
  status?: LoanStatus;
};

export interface CreateLoanOfferRequest {
  loan_id: string;
  offer_type: LoanOfferType;
  offer_amount: number;
  interest_rate?: number;
  term_months?: number;
  terms?: string;
  conditions?: string;
  is_binding?: boolean;
}

export interface UpdateLoanOfferRequest {
  status?: LoanOfferStatus;
}

export interface CreateLoanPaymentRequest {
  loan_id: string;
  offer_id?: string;
  amount: number;
  currency: CurrencyCode;
  payment_type: PaymentType;
  payer_id?: string;
  recipient_id: string;
  transaction_id?: string;
  payment_method?: PaymentMethod;
  notes?: string;
}

// ==================== API RESPONSE TYPES ====================

export interface LoanResponse {
  success: boolean;
  loan?: Loan;
  error?: string;
}

export interface LoansListResponse {
  success: boolean;
  loans?: Loan[];
  total?: number;
  error?: string;
}

export interface LoanOfferResponse {
  success: boolean;
  offer?: LoanOffer;
  offer_id?: string;
  error?: string;
}

export interface LoanOffersListResponse {
  success: boolean;
  offers?: LoanOffer[];
  total?: number;
  error?: string;
}

export interface LoanPaymentResponse {
  success: boolean;
  payment?: LoanPayment;
  error?: string;
}

// ==================== PAGINATION & FILTERING ====================

export type Pagination = OffsetPagination;

export interface LoansQuery {
  user_id?: string;
  status?: LoanStatus;
  is_public?: boolean;
  category_id?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: 'created_at' | 'remaining_balance' | 'interest_rate' | 'total_offers';
  sort_order?: 'asc' | 'desc';
}

export interface LoanOffersQuery {
  loan_id?: string;
  offerer_id?: string;
  status?: LoanOfferStatus;
  offer_type?: LoanOfferType;
  sort_by?: 'created_at' | 'offer_amount' | 'interest_rate';
  sort_order?: 'asc' | 'desc';
}
