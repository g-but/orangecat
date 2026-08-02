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

type LoanStatus = 'active' | 'paid_off' | 'refinanced' | 'defaulted' | 'cancelled';

type LoanOfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

type LoanOfferType = 'refinance' | 'payoff';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentType = 'monthly' | 'lump_sum' | 'refinance' | 'payoff';

// Use CurrencyCode directly from @/config/currencies instead of creating an alias

type ContactMethod = 'platform' | 'email' | 'phone';

export type PaymentMethod = 'bitcoin' | 'lightning' | 'bank_transfer' | 'card' | 'other';

// ==================== DATABASE TYPES ====================

export interface LoanCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type LoanType = 'new_request' | 'existing_loan';

type FulfillmentType = 'lightning' | 'onchain' | 'bank_transfer' | 'other';

export interface Loan {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  loan_category_id?: string;
  original_amount: number;
  remaining_balance: number;
  interest_rate?: number;
  monthly_payment?: number;
  currency: CurrencyCode;
  lender_name?: string;
  loan_number?: string;
  origination_date?: string;
  maturity_date?: string;
  status: LoanStatus;
  is_public: boolean;
  is_negotiable: boolean;
  minimum_offer_amount?: number;
  preferred_terms?: string;
  contact_method: ContactMethod;
  // Loan type and fulfillment
  loan_type?: LoanType;
  fulfillment_type?: FulfillmentType;
  // Existing loan details (for refinancing)
  current_lender?: string;
  current_interest_rate?: number;
  desired_rate?: number;
  // Bitcoin payment addresses
  bitcoin_address?: string;
  lightning_address?: string;
  created_at: string;
  updated_at: string;
  paid_off_at?: string;
  // Index signature for BaseEntity compatibility
  [key: string]: unknown;
}

export interface LoanOffer {
  id: string;
  loan_id: string;
  offerer_id: string;
  offer_type: LoanOfferType;
  offer_amount: number;
  interest_rate?: number;
  term_months?: number;
  monthly_payment?: number;
  terms?: string;
  conditions?: string;
  status: LoanOfferStatus;
  is_binding: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  rejected_at?: string;
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
