/**
 * LOANS SERVICE - Loan Mutations
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from loans/index.ts for modularity
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { isSupportedCurrency, DEFAULT_CURRENCY } from '@/config/currencies';
import { getTableName } from '@/config/entity-registry';
import type {
  CreateLoanRequest,
  UpdateLoanRequest,
  LoanResponse,
  Loan,
} from '@/types/loans';
import { getCurrentUserId } from '../utils/auth';
import { validateCreateLoanRequest } from '../utils/validation';

/**
 * Create a new loan listing
 */
export async function createLoan(request: CreateLoanRequest): Promise<LoanResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate request
    const validation = validateCreateLoanRequest(request);
    if (!validation.valid) {
      return { success: false, error: validation.errors[0]?.message || 'Invalid request' };
    }

    const { data, error } = await (supabase
      .from(getTableName('loan')) as any)
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
export async function updateLoan(loanId: string, request: UpdateLoanRequest): Promise<LoanResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await (supabase
      .from(getTableName('loan')) as any)
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
 * Delete a loan
 */
export async function deleteLoan(loanId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const { error } = await (supabase
      .from(getTableName('loan')) as any)
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

/**
 * Create a new obligation loan after payoff/refinance
 */
export async function createObligationLoan(params: {
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
      monthly_payment: undefined,
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

    const { data, error } = await (supabase
      .from(getTableName('loan')) as any)
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
