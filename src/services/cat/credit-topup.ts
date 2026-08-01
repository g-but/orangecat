/**
 * Cat Credits — Lightning top-up (Phase 2).
 *
 * A user buys credits by paying a Lightning invoice issued from OrangeCat's own
 * receiving wallet (platform NWC). On settlement we post a `topup` entry to the
 * cat_credit_entries ledger — idempotent via unique(kind, ref=payment_hash).
 *
 * Amounts are BTC end to end (canonical unit); sats appear ONLY when calling the
 * Lightning protocol (makeInvoice takes sats). Settlement is detected by polling
 * lookupInvoice — the same pattern OC already uses for seller payments — so no
 * webhook infra is needed. All server-only (uses the service-role client).
 *
 * Gated on PLATFORM_NWC_URI: when unset, initiate/check report "not enabled" and
 * the rest of Cat Credits is unaffected. See docs/architecture/CAT_CREDITS.md.
 */

import { getAdminClient } from '@/lib/supabase/admin';
import type { AnySupabaseClient } from '@/lib/supabase/types';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getPlatformNwcClient, platformReceiveEnabled } from '@/lib/bitcoin/platform-wallet';
import { appendCreditEntry, getCreditBalance } from '@/services/cat/credits';
import { logger } from '@/utils/logger';

/** Top-up bounds in BTC (1-sat precision). 0.00001 BTC = 1k sats … 0.01 BTC = 1M sats. */
export { MIN_TOPUP_BTC, MAX_TOPUP_BTC } from '@/config/cat-plans';
import { MIN_TOPUP_BTC, MAX_TOPUP_BTC } from '@/config/cat-plans';
/** Invoice validity. */
const INVOICE_EXPIRY_SECONDS = 3600;
const SATS_PER_BTC = 100_000_000;

export interface TopUpInvoice {
  topupId: string;
  bolt11: string;
  paymentHash: string;
  amountBtc: number;
  expiresAt: string;
}

export type TopUpStatus =
  | { status: 'pending' }
  | { status: 'paid'; balanceBtc: number }
  | { status: 'expired' }
  | { status: 'not_found' }
  | { status: 'not_enabled' };

/** Round a BTC amount to 8 dp (1-sat precision) — guards float drift. */
function toBtc8(n: number): number {
  return Math.round(n * SATS_PER_BTC) / SATS_PER_BTC;
}

/**
 * Issue a Lightning invoice from the platform wallet for `amountBtc` and record
 * a pending top-up tied to the user. Returns null if top-up isn't enabled or the
 * amount is out of bounds.
 */
export async function initiateTopUp(
  userId: string,
  amountBtc: number
): Promise<TopUpInvoice | null> {
  if (!platformReceiveEnabled()) {
    return null;
  }
  const amount = toBtc8(amountBtc);
  if (!(amount >= MIN_TOPUP_BTC) || amount > MAX_TOPUP_BTC) {
    return null;
  }

  const client = await getPlatformNwcClient();
  if (!client) {
    return null;
  }

  try {
    // Sats only here — the Lightning protocol boundary.
    const sats = Math.round(amount * SATS_PER_BTC);
    const invoice = await client.makeInvoice(
      sats,
      'OrangeCat — Cat Credits top-up',
      INVOICE_EXPIRY_SECONDS
    );

    const expiresAt = new Date(Date.now() + INVOICE_EXPIRY_SECONDS * 1000).toISOString();
    const admin = getAdminClient() as unknown as AnySupabaseClient;
    const { data, error } = await admin
      .from(DATABASE_TABLES.CAT_CREDIT_TOPUPS)
      .insert({
        user_id: userId,
        amount_btc: amount,
        payment_hash: invoice.payment_hash,
        bolt11: invoice.invoice,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (error || !data) {
      logger.error('Failed to record top-up', { error }, 'CatCredits');
      return null;
    }

    return {
      topupId: (data as { id: string }).id,
      bolt11: invoice.invoice,
      paymentHash: invoice.payment_hash,
      amountBtc: amount,
      expiresAt,
    };
  } catch (err) {
    logger.error('initiateTopUp threw', { err }, 'CatCredits');
    return null;
  } finally {
    client.disconnect();
  }
}

/**
 * Poll a pending top-up: if the invoice has settled, credit the ledger (once)
 * and mark it paid. Crediting goes to the top-up's recorded owner, never the
 * caller, so a poller can't claim someone else's payment.
 */
export async function checkTopUp(userId: string, topupId: string): Promise<TopUpStatus> {
  if (!platformReceiveEnabled()) {
    return { status: 'not_enabled' };
  }

  const admin = getAdminClient() as unknown as AnySupabaseClient;
  const { data: row } = await admin
    .from(DATABASE_TABLES.CAT_CREDIT_TOPUPS)
    .select('id, user_id, amount_btc, payment_hash, status, expires_at')
    .eq('id', topupId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!row) {
    return { status: 'not_found' };
  }
  const topup = row as {
    id: string;
    user_id: string;
    amount_btc: number;
    payment_hash: string;
    status: string;
    expires_at: string;
  };

  if (topup.status === 'paid') {
    return { status: 'paid', balanceBtc: await getCreditBalance(admin, topup.user_id) };
  }
  if (topup.status === 'expired') {
    return { status: 'expired' };
  }

  const client = await getPlatformNwcClient();
  if (!client) {
    return { status: 'not_enabled' };
  }

  try {
    const invoice = await client.lookupInvoice(topup.payment_hash);
    if (invoice.settled_at) {
      // Credit the OWNER first — idempotent on payment_hash (unique ref in the
      // ledger), so a retried settlement never double-credits. Mark paid ONLY if
      // the credit actually landed: if the append fails (transient DB error), we
      // must NOT flip status to paid, or the next poll short-circuits on 'paid'
      // and the user's Lightning payment is lost with no credit. Leaving it
      // pending lets the next poll retry the (idempotent) credit.
      const balanceBtc = await appendCreditEntry(admin, topup.user_id, {
        kind: 'topup',
        amountBtc: topup.amount_btc,
        ref: topup.payment_hash,
        metadata: { source: 'lightning', topupId: topup.id },
      });
      if (balanceBtc === null) {
        logger.warn(
          'top-up settled but crediting failed — staying pending for retry',
          { topupId: topup.id },
          'CatCredits'
        );
        return { status: 'pending' };
      }
      await admin
        .from(DATABASE_TABLES.CAT_CREDIT_TOPUPS)
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', topup.id);
      return { status: 'paid', balanceBtc };
    }
  } catch (err) {
    // Transient relay/lookup failure — report pending; client polls again.
    logger.warn('checkTopUp lookup failed', { err }, 'CatCredits');
    return { status: 'pending' };
  } finally {
    client.disconnect();
  }

  // Not settled yet — expire it if the window passed.
  if (new Date(topup.expires_at).getTime() < Date.now()) {
    await admin
      .from(DATABASE_TABLES.CAT_CREDIT_TOPUPS)
      .update({ status: 'expired' })
      .eq('id', topup.id);
    return { status: 'expired' };
  }
  return { status: 'pending' };
}
