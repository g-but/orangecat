/**
 * LOANS SERVICE - Peer-to-Peer Lending & Refinancing Platform
 *
 * Comprehensive loans management system for OrangeCat:
 * - Loan listing and management
 * - Refinancing offer system
 * - Payment tracking and processing
 * - Community lending marketplace
 *
 * Created: 2025-12-02
 * Last Modified: 2025-12-02
 * Last Modified Summary: Initial implementation of comprehensive loans service
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { isSupportedCurrency, DEFAULT_CURRENCY } from '@/config/currencies';
import {
  Loan,
  LoanOffer,
  LoanPayment,
  LoanCategory,
  LoanStats,
  UserLoanSummary,
  AvailableLoan,
  CreateLoanRequest,
  UpdateLoanRequest,
  CreateLoanOfferRequest,
  UpdateLoanOfferRequest,
  CreateLoanPaymentRequest,
  LoanResponse,
  LoansListResponse,
  LoanOfferResponse,
  LoanOffersListResponse,
  LoanPaymentResponse,
  LoanStatsResponse,
  LoansQuery,
  LoanOffersQuery,
  Pagination,
} from '@/types/loans';

class LoansService {
  private readonly DEFAULT_PAGE_SIZE = 20;
  private readonly MAX_PAGE_SIZE = 100;

  // ==================== LOAN MANAGEMENT ====================

  /**
   * Create a new loan listing
   */
  async createLoan(request: CreateLoanRequest): Promise<LoanResponse> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }

      // Validate request
      const validation = this.validateCreateLoanRequest(request);
      if (!validation.valid) {
        return { success: false, error: validation.errors[0]?.message || 'Invalid request' };
      }

      const { data, error } = await supabase
        .from('loans')
        .insert({
          ...request,
          currency: isSupportedCurrency(request.currency) ? request.currency : DEFAULT_CURRENCY,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create loan', error, 'Loans');
        return { success: false, error: error.message };
      }

      logger.info('Loan created successfully', { loanId: data.id }, 'Loans');
      return { success: true, loan: data };
    } catch (error) {
      logger.error('Exception creating loan', error, 'Loans');
      return { success: false, error: 'Failed to create loan' };
    }
  }

  /**
   * Update an existing loan
   */
  async updateLoan(loanId: string, request: UpdateLoanRequest): Promise<LoanResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      const { data, error } = await supabase
        .from('loans')
        .update(request)
        .eq('id', loanId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update loan', error, 'Loans');
        return { success: false, error: error.message };
      }

      logger.info('Loan updated successfully', { loanId }, 'Loans');
      return { success: true, loan: data };
    } catch (error) {
      logger.error('Exception updating loan', error, 'Loans');
      return { success: false, error: 'Failed to update loan' };
    }
  }

  /**
   * Get a specific loan by ID
   */
  async getLoan(loanId: string): Promise<LoanResponse> {
    try {
      const userId = await this.getCurrentUserId();

      let query = supabase
        .from('loans')
        .select(`
          *,
          loan_categories (
            id,
            name,
            description,
            icon
          )
        `)
        .eq('id', loanId);

      // If user is authenticated, they can see their own loans or public loans
      if (userId) {
        query = query.or(`user_id.eq.${userId},is_public.eq.true`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.single();

      if (error) {
        logger.error('Failed to get loan', error, 'Loans');
        return { success: false, error: error.message };
      }

      return { success: true, loan: data };
    } catch (error) {
      logger.error('Exception getting loan', error, 'Loans');
      return { success: false, error: 'Failed to get loan' };
    }
  }

  /**
   * Get loans for current user
   */
  async getUserLoans(query?: LoansQuery, pagination?: Pagination): Promise<LoansListResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      let dbQuery = supabase
        .from('loans')
        .select(`
          *,
          loan_categories (
            id,
            name,
            description,
            icon
          )
        `, { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (query?.status) {
        dbQuery = dbQuery.eq('status', query.status);
      }
      if (query?.is_public !== undefined) {
        dbQuery = dbQuery.eq('is_public', query.is_public);
      }
      if (query?.category_id) {
        dbQuery = dbQuery.eq('loan_category_id', query.category_id);
      }
      if (query?.min_amount) {
        dbQuery = dbQuery.gte('remaining_balance', query.min_amount);
      }
      if (query?.max_amount) {
        dbQuery = dbQuery.lte('remaining_balance', query.max_amount);
      }

      // Apply sorting
      const sortBy = query?.sort_by || 'created_at';
      const sortOrder = query?.sort_order || 'desc';
      dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const pageSize = Math.min(pagination?.pageSize || this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
      const page = pagination?.page || 1;
      const offset = (page - 1) * pageSize;

      dbQuery = dbQuery.range(offset, offset + pageSize - 1);

      const { data, error, count } = await dbQuery;

      if (error) {
        logger.error('Failed to get user loans', error, 'Loans');
        return { success: false, error: error.message };
      }

      return { success: true, loans: data || [], total: count || 0 };
    } catch (error) {
      logger.error('Exception getting user loans', error, 'Loans');
      return { success: false, error: 'Failed to get loans' };
    }
  }

  /**
   * Get available loans for offering (public loans from other users)
   */
  async getAvailableLoans(query?: LoansQuery, pagination?: Pagination): Promise<LoansListResponse> {
    try {
      const userId = await this.getCurrentUserId();

      // Use the database function for efficiency
      const pageSize = Math.min(pagination?.pageSize || this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
      const offset = pagination?.offset || 0;

      const { data, error } = await supabase.rpc('get_available_loans', {
        p_user_id: userId || null,
        p_limit: pageSize,
        p_offset: offset,
      });

      if (error) {
        logger.warn('Database function not available, using fallback', error, 'Loans');

        // Fallback query
        let dbQuery = supabase
          .from('loans')
          .select(`
            *,
            loan_categories (
              id,
              name,
              description,
              icon
            ),
            profiles!loans_user_id_fkey (
              username,
              display_name,
              avatar_url
            )
          `, { count: 'exact' })
          .eq('is_public', true)
          .eq('status', 'active');

        if (userId) {
          dbQuery = dbQuery.neq('user_id', userId);
        }

        // Apply filters
        if (query?.category_id) {
          dbQuery = dbQuery.eq('loan_category_id', query.category_id);
        }
        if (query?.min_amount) {
          dbQuery = dbQuery.gte('remaining_balance', query.min_amount);
        }
        if (query?.max_amount) {
          dbQuery = dbQuery.lte('remaining_balance', query.max_amount);
        }

        dbQuery = dbQuery.order('created_at', { ascending: false });
        dbQuery = dbQuery.range(offset, offset + pageSize - 1);

        const fallbackResult = await dbQuery;
        if (fallbackResult.error) {
          logger.error('Fallback query failed', fallbackResult.error, 'Loans');
          return { success: false, error: fallbackResult.error.message };
        }

        return { success: true, loans: fallbackResult.data || [], total: fallbackResult.count || 0 };
      }

      return { success: true, loans: data || [], total: data?.length || 0 };
    } catch (error) {
      logger.error('Exception getting available loans', error, 'Loans');
      return { success: false, error: 'Failed to get available loans' };
    }
  }

  /**
   * Delete a loan
   */
  async deleteLoan(loanId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', loanId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to delete loan', error, 'Loans');
        return { success: false, error: error.message };
      }

      logger.info('Loan deleted successfully', { loanId }, 'Loans');
      return { success: true };
    } catch (error) {
      logger.error('Exception deleting loan', error, 'Loans');
      return { success: false, error: 'Failed to delete loan' };
    }
  }

  // ==================== LOAN OFFER MANAGEMENT ====================

  /**
   * Create a loan offer
   */
  async createLoanOffer(request: CreateLoanOfferRequest): Promise<LoanOfferResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      // Use database function if available
      try {
        const { data, error } = await supabase.rpc('create_loan_offer', {
          p_loan_id: request.loan_id,
          p_offerer_id: userId,
          p_offer_type: request.offer_type,
          p_offer_amount: request.offer_amount,
          p_interest_rate: request.interest_rate,
          p_term_months: request.term_months,
          p_terms: request.terms,
        });

        if (error) {
          logger.warn('Database function failed, using fallback', error, 'Loans');
          throw error;
        }

        if (!data?.success) {
          return { success: false, error: data?.error || 'Failed to create offer' };
        }

        // Get the created offer
        const { data: offer, error: fetchError } = await supabase
          .from('loan_offers')
          .select()
          .eq('id', data.offer_id)
          .single();

        if (fetchError) {
          logger.error('Failed to fetch created offer', fetchError, 'Loans');
          return { success: false, error: 'Offer created but failed to retrieve' };
        }

        return { success: true, offer };
      } catch (dbError) {
        logger.warn('Using fallback offer creation', dbError, 'Loans');

        // Fallback: direct insert
        const { data, error } = await supabase
          .from('loan_offers')
          .insert({
            ...request,
            offerer_id: userId,
          })
          .select()
          .single();

        if (error) {
          logger.error('Fallback offer creation failed', error, 'Loans');
          return { success: false, error: error.message };
        }

        return { success: true, offer: data };
      }
    } catch (error) {
      logger.error('Exception creating loan offer', error, 'Loans');
      return { success: false, error: 'Failed to create offer' };
    }
  }

  /**
   * Update a loan offer
   */
  async updateLoanOffer(offerId: string, request: UpdateLoanOfferRequest): Promise<LoanOfferResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      const { data, error } = await supabase
        .from('loan_offers')
        .update(request)
        .eq('id', offerId)
        .eq('offerer_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update loan offer', error, 'Loans');
        return { success: false, error: error.message };
      }

      return { success: true, offer: data };
    } catch (error) {
      logger.error('Exception updating loan offer', error, 'Loans');
      return { success: false, error: 'Failed to update offer' };
    }
  }

  /**
   * Get offers for a loan
   */
  async getLoanOffers(loanId: string, query?: LoanOffersQuery, pagination?: Pagination): Promise<LoanOffersListResponse> {
    try {
      const userId = await this.getCurrentUserId();

      let dbQuery = supabase
        .from('loan_offers')
        .select(`
          *,
          profiles!loan_offers_offerer_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('loan_id', loanId);

      // Apply filters
      if (query?.status) {
        dbQuery = dbQuery.eq('status', query.status);
      }
      if (query?.offer_type) {
        dbQuery = dbQuery.eq('offer_type', query.offer_type);
      }

      // Apply sorting
      const sortBy = query?.sort_by || 'created_at';
      const sortOrder = query?.sort_order || 'desc';
      dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const pageSize = Math.min(pagination?.pageSize || this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
      const page = pagination?.page || 1;
      const offset = (page - 1) * pageSize;

      dbQuery = dbQuery.range(offset, offset + pageSize - 1);

      const { data, error, count } = await dbQuery;

      if (error) {
        logger.error('Failed to get loan offers', error, 'Loans');
        return { success: false, error: error.message };
      }

      return { success: true, offers: data || [], total: count || 0 };
    } catch (error) {
      logger.error('Exception getting loan offers', error, 'Loans');
      return { success: false, error: 'Failed to get offers' };
    }
  }

  /**
   * Get offers the current user has made
   */
  async getUserOffers(query?: LoanOffersQuery, pagination?: Pagination): Promise<LoanOffersListResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      let dbQuery = supabase
        .from('loan_offers')
        .select(`
          *,
          loans!loan_offers_loan_id_fkey (
            id,
            title,
            remaining_balance,
            interest_rate,
            currency,
            status,
            user_id
          )
        `, { count: 'exact' })
        .eq('offerer_id', userId);

      if (query?.status) {
        dbQuery = dbQuery.eq('status', query.status);
      }
      if (query?.offer_type) {
        dbQuery = dbQuery.eq('offer_type', query.offer_type);
      }

      const sortBy = query?.sort_by || 'created_at';
      const sortOrder = query?.sort_order || 'desc';
      dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      const pageSize = Math.min(pagination?.pageSize || this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
      const page = pagination?.page || 1;
      const offset = (page - 1) * pageSize;
      dbQuery = dbQuery.range(offset, offset + pageSize - 1);

      const { data, error, count } = await dbQuery;

      if (error) {
        logger.error('Failed to get user offers', error, 'Loans');
        return { success: false, error: error.message };
      }

      return { success: true, offers: data || [], total: count || 0 };
    } catch (error) {
      logger.error('Exception getting user offers', error, 'Loans');
      return { success: false, error: 'Failed to get offers' };
    }
  }

  /**
   * Accept or reject a loan offer
   */
  async respondToOffer(offerId: string, accept: boolean, notes?: string): Promise<LoanOfferResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      // Verify user owns the loan
      const { data: offer, error: fetchError } = await supabase
        .from('loan_offers')
        .select(`
          *,
          loans!inner(user_id)
        `)
        .eq('id', offerId)
        .single();

      if (fetchError || !offer) {
        return { success: false, error: 'Offer not found' };
      }

      if (offer.loans.user_id !== userId) {
        return { success: false, error: 'Unauthorized to respond to this offer' };
      }

      const status = accept ? 'accepted' : 'rejected';
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (accept) {
        updateData.accepted_at = new Date().toISOString();
      } else {
        updateData.rejected_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('loan_offers')
        .update(updateData)
        .eq('id', offerId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to respond to offer', error, 'Loans');
        return { success: false, error: error.message };
      }

      logger.info(`Offer ${status}`, { offerId, loanId: offer.loan_id }, 'Loans');
      return { success: true, offer: data };
    } catch (error) {
      logger.error('Exception responding to offer', error, 'Loans');
      return { success: false, error: 'Failed to respond to offer' };
    }
  }

  // ==================== PAYMENT MANAGEMENT ====================

  /**
   * Record a loan payment
   */
  async createPayment(request: CreateLoanPaymentRequest): Promise<LoanPaymentResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      const { data, error } = await supabase
        .from('loan_payments')
        .insert({
          ...request,
          payer_id: userId,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create payment', error, 'Loans');
        return { success: false, error: error.message };
      }

      return { success: true, payment: data };
    } catch (error) {
      logger.error('Exception creating payment', error, 'Loans');
      return { success: false, error: 'Failed to create payment' };
    }
  }

  /**
   * Mark a payment as completed and return the updated payment
   */
  async completePayment(paymentId: string): Promise<LoanPaymentResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      const { data, error } = await supabase
        .from('loan_payments')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to complete payment', error, 'Loans');
        return { success: false, error: error.message };
      }

      return { success: true, payment: data };
    } catch (error) {
      logger.error('Exception completing payment', error, 'Loans');
      return { success: false, error: 'Failed to complete payment' };
    }
  }

  /**
   * Create a new obligation loan after payoff/refinance
   * (scaffold; invoke after payment confirmation)
   */
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
    try {
      const { borrowerId, lenderProfileName, offer } = params;

      const newLoan: CreateLoanRequest = {
        title: 'Refinanced Loan',
        description: 'Refinanced via OrangeCat offer',
        original_amount: offer.offer_amount,
        remaining_balance: offer.offer_amount,
        interest_rate: offer.interest_rate,
        monthly_payment: undefined, // can be computed client-side if needed
        currency: isSupportedCurrency(offer.currency) ? offer.currency : DEFAULT_CURRENCY,
        lender_name: lenderProfileName,
        loan_number: undefined,
        origination_date: new Date().toISOString(),
        maturity_date: undefined,
        is_public: false,
        is_negotiable: false,
        minimum_offer_amount: undefined,
        preferred_terms: undefined,
        contact_method: 'platform',
      };

      const { data, error } = await supabase
        .from('loans')
        .insert({
          ...newLoan,
          user_id: borrowerId,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create obligation loan', error, 'Loans');
        return { success: false, error: error.message };
      }

      return { success: true, loan: data as Loan };
    } catch (error) {
      logger.error('Exception creating obligation loan', error, 'Loans');
      return { success: false, error: 'Failed to create obligation loan' };
    }
  }

  // ==================== LOAN CATEGORIES ====================

  /**
   * Get all loan categories
   */
  async getLoanCategories(): Promise<{ success: boolean; categories?: LoanCategory[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('loan_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('Failed to get loan categories', error, 'Loans');
        return { success: false, error: error.message };
      }

      return { success: true, categories: data || [] };
    } catch (error) {
      logger.error('Exception getting loan categories', error, 'Loans');
      return { success: false, error: 'Failed to get categories' };
    }
  }

  // ==================== UTILITY METHODS ====================

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      return null;
    }
  }

  private validateCreateLoanRequest(request: CreateLoanRequest): { valid: boolean; errors: Array<{ field: string; message: string }> } {
    const errors: Array<{ field: string; message: string }> = [];

    if (!request.title || request.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
    }

    if (!request.original_amount || request.original_amount <= 0) {
      errors.push({ field: 'original_amount', message: 'Original amount must be greater than 0' });
    }

    if (!request.remaining_balance || request.remaining_balance <= 0) {
      errors.push({ field: 'remaining_balance', message: 'Remaining balance must be greater than 0' });
    }

    if (request.remaining_balance > request.original_amount) {
      errors.push({ field: 'remaining_balance', message: 'Remaining balance cannot exceed original amount' });
    }

    if (request.currency && !isSupportedCurrency(request.currency)) {
      errors.push({ field: 'currency', message: 'Unsupported currency' });
    }

    if (request.interest_rate && (request.interest_rate < 0 || request.interest_rate > 100)) {
      errors.push({ field: 'interest_rate', message: 'Interest rate must be between 0 and 100' });
    }

    return { valid: errors.length === 0, errors };
  }
}

// Export singleton instance
const loansService = new LoansService();
export default loansService;

// Export class for testing
export { LoansService };








