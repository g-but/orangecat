/**
 * LOANS SYSTEM TYPES
 *
 * Comprehensive type definitions for the peer-to-peer lending and refinancing platform.
 * Enables users to list loans for refinancing and allows community lending.
 */

import { type CurrencyCode } from '@/config/currencies';

export type LoanStatus = 'active' | 'paid_off' | 'refinanced' | 'defaulted' | 'cancelled';

export type LoanOfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export type LoanOfferType = 'refinance' | 'payoff';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentType = 'monthly' | 'lump_sum' | 'refinance' | 'payoff';

export type Currency = CurrencyCode;

export type ContactMethod = 'platform' | 'email' | 'phone';

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
  currency: Currency;
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
  created_at: string;
  updated_at: string;
  paid_off_at?: string;
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
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  offer_id?: string;
  amount: number;
  currency: Currency;
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

// ==================== AGGREGATED TYPES ====================

export interface LoanStats {
  loan_id: string;
  loan_owner_id: string;
  remaining_balance: number;
  interest_rate?: number;
  status: LoanStatus;
  total_offers: number;
  pending_offers: number;
  accepted_offers: number;
  best_offer_amount?: number;
  best_interest_rate?: number;
  best_term_months?: number;
  total_paid: number;
  last_payment_date?: string;
}

export interface UserLoanSummary {
  id: string;
  title: string;
  remaining_balance: number;
  interest_rate?: number;
  status: LoanStatus;
  total_offers: number;
  pending_offers: number;
  last_payment_date?: string;
}

export interface AvailableLoan {
  id: string;
  title: string;
  description?: string;
  remaining_balance: number;
  interest_rate?: number;
  monthly_payment?: number;
  lender_name?: string;
  total_offers: number;
  best_offer_amount?: number;
  best_interest_rate?: number;
  owner_username?: string;
  owner_display_name?: string;
  created_at: string;
}

// ==================== FORM TYPES ====================

export interface CreateLoanRequest {
  title: string;
  description?: string;
  loan_category_id?: string;
  original_amount: number;
  remaining_balance: number;
  interest_rate?: number;
  monthly_payment?: number;
  currency: Currency;
  lender_name?: string;
  loan_number?: string;
  origination_date?: string;
  maturity_date?: string;
  is_public: boolean;
  is_negotiable: boolean;
  minimum_offer_amount?: number;
  preferred_terms?: string;
  contact_method: ContactMethod;
}

export interface UpdateLoanRequest extends Partial<CreateLoanRequest> {
  status?: LoanStatus;
}

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
  currency: Currency;
  payment_type: PaymentType;
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

export interface LoanStatsResponse {
  success: boolean;
  stats?: LoanStats;
  error?: string;
}

// ==================== PAGINATION & FILTERING ====================

export interface Pagination {
  page?: number;
  pageSize?: number;
  offset?: number;
}

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

export interface LoansPagination extends Pagination {
  query?: LoansQuery;
}

export interface LoanOffersPagination extends Pagination {
  query?: LoanOffersQuery;
}

// ==================== DISPLAY TYPES ====================

export interface LoanCardData extends Loan {
  category?: LoanCategory;
  stats?: LoanStats;
  owner_profile?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface LoanOfferCardData extends LoanOffer {
  loan?: LoanCardData;
  offerer_profile?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface LoanDashboardData {
  myLoans: LoanCardData[];
  myOffers: LoanOfferCardData[];
  availableLoans: LoanCardData[];
  recentPayments: LoanPayment[];
  stats: {
    totalLoans: number;
    activeLoans: number;
    totalOffers: number;
    pendingOffers: number;
    totalPaid: number;
    totalSaved: number; // Estimated savings from refinancing
  };
}

// ==================== VALIDATION TYPES ====================

export interface LoanValidationError {
  field: keyof CreateLoanRequest;
  message: string;
}

export interface LoanValidationResult {
  valid: boolean;
  errors: LoanValidationError[];
}

// ==================== UTILITY TYPES ====================

export type LoanFormMode = 'create' | 'edit' | 'view';

export type LoanOfferFormMode = 'create' | 'view';

export interface LoanFilters {
  status?: LoanStatus[];
  categories?: string[];
  amountRange?: [number, number];
  interestRange?: [number, number];
  negotiable?: boolean;
}

export interface LoanSortOption {
  label: string;
  value: string;
  field: string;
  direction: 'asc' | 'desc';
}

// ==================== HOOK TYPES ====================

export interface UseLoansOptions {
  query?: LoansQuery;
  pagination?: Pagination;
  enabled?: boolean;
}

export interface UseLoanOptions {
  loanId: string;
  enabled?: boolean;
}

export interface UseLoanOffersOptions {
  loanId?: string;
  offererId?: string;
  query?: LoanOffersQuery;
  pagination?: Pagination;
  enabled?: boolean;
}

export interface UseCreateLoanOptions {
  onSuccess?: (loan: Loan) => void;
  onError?: (error: string) => void;
}

export interface UseUpdateLoanOptions extends UseCreateLoanOptions {
  loanId: string;
}

export interface UseCreateOfferOptions {
  onSuccess?: (offer: LoanOffer) => void;
  onError?: (error: string) => void;
}

export interface UseUpdateOfferOptions extends UseCreateOfferOptions {
  offerId: string;
}










