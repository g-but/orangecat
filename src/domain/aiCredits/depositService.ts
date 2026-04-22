/**
 * AI Credits Deposit Service
 *
 * Business logic for creating AI credit deposit requests.
 */

import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getPaymentProvider } from '@/services/bitcoin/paymentService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export interface DepositResult {
  deposit_id: string;
  amount_btc: number;
  payment_method: string;
  status: string;
  expires_at: string;
  payment_details: { invoice: string | null; address?: string };
  development_mode?: boolean;
  message?: string;
}

export async function createCreditDeposit(
  supabase: AnyClient,
  userId: string,
  amountBtc: number,
  paymentMethod: 'lightning' | 'onchain'
): Promise<DepositResult> {
  const depositId = `dep_${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { data: deposit, error: depositError } = await (
    supabase.from(DATABASE_TABLES.AI_CREDIT_DEPOSITS) as AnyClient
  )
    .insert({ id: depositId, user_id: userId, amount_btc: amountBtc, payment_method: paymentMethod, status: 'pending', expires_at: expiresAt })
    .select()
    .single();

  // Table doesn't exist yet — return mock for development
  if (depositError?.code === '42P01') {
    logger.info('ai_credit_deposits table does not exist, returning mock data');
    return {
      deposit_id: depositId,
      amount_btc: amountBtc,
      payment_method: paymentMethod,
      status: 'pending',
      expires_at: expiresAt,
      payment_details: { invoice: null },
      development_mode: true,
      message: 'Payment integration not configured. Use manual credits for testing.',
    };
  }

  if (depositError) {throw depositError;}

  let paymentDetails: { invoice: string | null; address?: string } = { invoice: null };

  try {
    const provider = getPaymentProvider();
    const paymentResult = await provider.createInvoice(
      amountBtc,
      `AI Credits deposit — ${amountBtc} BTC`,
      paymentMethod
    );

    if (paymentResult.success && paymentResult.invoice) {
      paymentDetails = { invoice: paymentResult.invoice.invoice ?? null, address: paymentResult.invoice.address };
      await (supabase.from(DATABASE_TABLES.AI_CREDIT_DEPOSITS) as AnyClient)
        .update({ payment_details: paymentDetails, provider_invoice_id: paymentResult.transactionId })
        .eq('id', deposit?.id || depositId);
    }
  } catch (providerError) {
    logger.warn('Payment provider unavailable, deposit recorded without invoice', {
      error: providerError instanceof Error ? providerError.message : providerError,
    });
  }

  return {
    deposit_id: deposit?.id || depositId,
    amount_btc: amountBtc,
    payment_method: paymentMethod,
    status: 'pending',
    expires_at: deposit?.expires_at || expiresAt,
    payment_details: paymentDetails,
  };
}
