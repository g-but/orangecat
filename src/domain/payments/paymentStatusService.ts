/**
 * Payment Status Service
 *
 * Checks payment status using the appropriate method:
 * - NWC: lookup_invoice via Nostr relay
 * - Lightning Address: buyer-confirmed (no server-side verification)
 * - On-chain: Mempool.space API polling
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { NWCClient } from '@/lib/nostr/nwc';
import { DATABASE_TABLES } from '@/config/database-tables';
import { checkAddressPayment, type OnchainPaymentCheck } from '@/lib/bitcoin/mempool';
import { decrypt } from './encryptionService';
import { logger } from '@/utils/logger';
import type { PaymentIntent } from './types';

/**
 * Check if an NWC payment has been settled by looking up the invoice on the relay.
 *
 * Returns true if paid, false otherwise.
 */
export async function checkNWCPaymentStatus(
  supabase: SupabaseClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentIntent: any
): Promise<boolean> {
  if (!paymentIntent.payment_hash) {
    return false;
  }

  // Get the seller's NWC URI to check the invoice
  const { data: wallet } = await supabase
    .from(DATABASE_TABLES.WALLETS)
    .select('nwc_connection_uri')
    .eq('profile_id', paymentIntent.seller_id)
    .not('nwc_connection_uri', 'is', null)
    .limit(1)
    .single();

  if (!wallet?.nwc_connection_uri) {
    return false;
  }

  let nwcUri: string;
  try {
    nwcUri = decrypt(wallet.nwc_connection_uri);
  } catch {
    logger.error('Failed to decrypt NWC URI for status check', {
      sellerId: paymentIntent.seller_id,
    });
    return false;
  }

  const client = new NWCClient(nwcUri);

  try {
    await client.connect();
    const invoice = await client.lookupInvoice(paymentIntent.payment_hash);

    // NWC invoice is settled when settled_at is set
    return !!invoice.settled_at;
  } catch (error) {
    logger.warn('NWC invoice lookup failed', {
      paymentHash: paymentIntent.payment_hash,
      error,
    });
    return false;
  } finally {
    client.disconnect();
  }
}

/**
 * Check if an on-chain Bitcoin payment has been received at the expected address.
 *
 * Uses the Mempool.space API to look for transactions paying to the address.
 * Returns an object describing what was found:
 * - `confirmed` (>= 1 confirmation) -> caller should mark as paid
 * - `in_mempool` (0 confirmations) -> caller should mark as pending_confirmation
 * - `not_found` -> no matching transaction yet
 *
 * Never throws — Mempool API errors are caught and logged internally.
 */
export async function checkOnchainPaymentStatus(
  paymentIntent: Pick<PaymentIntent, 'id' | 'onchain_address' | 'amount_sats' | 'created_at'>
): Promise<'confirmed' | 'in_mempool' | 'not_found'> {
  if (!paymentIntent.onchain_address || !paymentIntent.amount_sats) {
    return 'not_found';
  }

  // Use the payment intent's created_at as a lower bound so we don't match
  // older transactions to the same address
  const sinceTimestamp = paymentIntent.created_at
    ? Math.floor(new Date(paymentIntent.created_at).getTime() / 1000)
    : undefined;

  const result: OnchainPaymentCheck = await checkAddressPayment({
    address: paymentIntent.onchain_address,
    expectedAmountSats: paymentIntent.amount_sats,
    sinceTimestamp,
  });

  if (!result.found) {
    return 'not_found';
  }

  logger.info(
    'On-chain payment detected',
    {
      paymentIntentId: paymentIntent.id,
      txid: result.txid,
      confirmations: result.confirmations,
      amountSats: result.amountSats,
    },
    'mempool'
  );

  if (result.confirmations && result.confirmations >= 1) {
    return 'confirmed';
  }

  return 'in_mempool';
}
