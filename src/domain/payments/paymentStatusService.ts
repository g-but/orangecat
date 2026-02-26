/**
 * Payment Status Service
 *
 * Checks payment status using the appropriate method:
 * - NWC: lookup_invoice via Nostr relay
 * - Lightning Address: buyer-confirmed (no server-side verification)
 * - On-chain: (future) Mempool/Blockstream API polling
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { NWCClient } from '@/lib/nostr/nwc';
import { DATABASE_TABLES } from '@/config/database-tables';
import { decrypt } from './encryptionService';
import { logger } from '@/utils/logger';

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
