/**
 * LOANS SERVICE - Main Orchestrator
 *
 * Unified service for loans operations.
 * Re-exports all functionality from modular sub-modules.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Refactored from 807-line monolith to modular architecture
 *
 * BEFORE: 807 lines in single file (102% over 400-line limit)
 * AFTER: Modular architecture with single responsibilities
 *
 * Architecture Benefits:
 * - Single Responsibility Principle
 * - Better testability
 * - Easier maintenance
 * - Improved code reuse
 * - Clear separation of concerns
 */

// Re-export queries
export * from './queries/loans';
export * from './queries/offers';

// Re-export mutations
export * from './mutations/loans';
export * from './mutations/offers';
export * from './mutations/payments';

// Re-export utils
export * from './utils/auth';
export * from './utils/validation';

// Import types
import type {
  CreateLoanRequest,
  UpdateLoanRequest,
  LoanResponse,
  LoansListResponse,
  LoansQuery,
  CreateLoanOfferRequest,
  UpdateLoanOfferRequest,
  LoanOfferResponse,
  LoanOffersListResponse,
  LoanOffersQuery,
  CreateLoanPaymentRequest,
  LoanPaymentResponse,
  Pagination,
  LoanCategory,
} from '@/types/loans';

// Import modular functions
import { getLoan, getUserLoans, getAvailableLoans, getLoanCategories } from './queries/loans';
import { getLoanOffers, getUserOffers } from './queries/offers';
import { createLoan, updateLoan, deleteLoan, createObligationLoan } from './mutations/loans';
import { createLoanOffer, updateLoanOffer, respondToOffer } from './mutations/offers';
import { createPayment, completePayment } from './mutations/payments';

/**
 * LoansService Class
 *
 * Provides a class-based interface for loans operations.
 * Internally uses the modular functions.
 * Maintains backward compatibility with existing code.
 */
class LoansService {
  private readonly DEFAULT_PAGE_SIZE = 20;
  private readonly MAX_PAGE_SIZE = 100;

  // ==================== LOAN MANAGEMENT ====================

  async createLoan(request: CreateLoanRequest): Promise<LoanResponse> {
    return createLoan(request);
  }

  async updateLoan(loanId: string, request: UpdateLoanRequest): Promise<LoanResponse> {
    return updateLoan(loanId, request);
  }

  async getLoan(loanId: string): Promise<LoanResponse> {
    return getLoan(loanId);
  }

  async getUserLoans(
    query?: LoansQuery,
    pagination?: Pagination
  ): Promise<LoansListResponse> {
    return getUserLoans(query, pagination);
  }

  async getAvailableLoans(
    query?: LoansQuery,
    pagination?: Pagination
  ): Promise<LoansListResponse> {
    return getAvailableLoans(query, pagination);
  }

  async deleteLoan(loanId: string): Promise<{ success: boolean; error?: string }> {
    return deleteLoan(loanId);
  }

  async createObligationLoan(params: {
    borrowerId: string;
    lenderProfileName: string;
    offer: {
      loan_id: string;
      offer_amount: number;
      interest_rate?: number;
      term_months?: number;
      currency?: string;
    };
  }): Promise<LoanResponse> {
    return createObligationLoan(params);
  }

  // ==================== LOAN OFFER MANAGEMENT ====================

  async createLoanOffer(request: CreateLoanOfferRequest): Promise<LoanOfferResponse> {
    return createLoanOffer(request);
  }

  async updateLoanOffer(
    offerId: string,
    request: UpdateLoanOfferRequest
  ): Promise<LoanOfferResponse> {
    return updateLoanOffer(offerId, request);
  }

  async getLoanOffers(
    loanId: string,
    query?: LoanOffersQuery,
    pagination?: Pagination
  ): Promise<LoanOffersListResponse> {
    return getLoanOffers(loanId, query, pagination);
  }

  async getUserOffers(
    query?: LoanOffersQuery,
    pagination?: Pagination
  ): Promise<LoanOffersListResponse> {
    return getUserOffers(query, pagination);
  }

  async respondToOffer(
    offerId: string,
    accept: boolean,
    notes?: string
  ): Promise<LoanOfferResponse> {
    return respondToOffer(offerId, accept, notes);
  }

  // ==================== PAYMENT MANAGEMENT ====================

  async createPayment(request: CreateLoanPaymentRequest): Promise<LoanPaymentResponse> {
    return createPayment(request);
  }

  async completePayment(paymentId: string): Promise<LoanPaymentResponse> {
    return completePayment(paymentId);
  }

  // ==================== LOAN CATEGORIES ====================

  async getLoanCategories(): Promise<{
    success: boolean;
    categories?: LoanCategory[];
    error?: string;
  }> {
    return getLoanCategories();
  }
}

// Export singleton instance
const loansService = new LoansService();
export default loansService;

// Export class for testing
export { LoansService };
