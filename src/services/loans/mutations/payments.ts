/**
 * LOANS SERVICE - Payment Mutations
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from loans/index.ts for modularity
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type { CreateLoanPaymentRequest, LoanPaymentResponse } from '@/types/loans';
import { getCurrentUserId } from '../utils/auth';

/**
 * Record a loan payment
 */
export async function createPayment(
  request: CreateLoanPaymentRequest
): Promise<LoanPaymentResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('loan_payments') as any)
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
export async function completePayment(
  paymentId: string
): Promise<LoanPaymentResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('loan_payments') as any)
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
