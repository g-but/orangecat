/**
 * LOANS SERVICE - Loan Offer Mutations
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from loans/index.ts for modularity
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type {
  CreateLoanOfferRequest,
  UpdateLoanOfferRequest,
  LoanOfferResponse,
} from '@/types/loans';
import { getCurrentUserId } from '../utils/auth';

/**
 * Create a loan offer
 */
export async function createLoanOffer(
  request: CreateLoanOfferRequest
): Promise<LoanOfferResponse> {
  try {
    const userId = await getCurrentUserId();
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
export async function updateLoanOffer(
  offerId: string,
  request: UpdateLoanOfferRequest
): Promise<LoanOfferResponse> {
  try {
    const userId = await getCurrentUserId();
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
 * Accept or reject a loan offer
 */
export async function respondToOffer(
  offerId: string,
  accept: boolean,
  notes?: string
): Promise<LoanOfferResponse> {
  try {
    const userId = await getCurrentUserId();
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

    if ((offer.loans as { user_id: string }).user_id !== userId) {
      return { success: false, error: 'Unauthorized to respond to this offer' };
    }

    const status = accept ? 'accepted' : 'rejected';
    const updateData: Record<string, unknown> = {
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
