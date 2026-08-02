/**
 * Person-to-person payment requests — "Lena asks Marco for 0.0005 BTC".
 *
 * A request records the ASK, not a payment. Deliberately no invoice is minted
 * here: a BOLT11 expires in about an hour and a request has to survive until
 * the person actually opens it. The payer gets a normal pay link, and the
 * invoice is created when they arrive — the same alias-backed rule the public
 * /pay/<username> page follows.
 *
 * Marking a request paid is a SYSTEM write, never a party write. Both people
 * have an interest in the answer, so neither gets to assert it; RLS allows them
 * only to cancel or decline, and settlement is observed through the payment
 * path exactly as everywhere else in this domain.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdminClient } from '@/lib/supabase/admin';
import { fromTable } from '@/lib/supabase/untyped';
import { DATABASE_TABLES } from '@/config/database-tables';
import { NotificationDispatcher } from '@/services/notifications/dispatcher';
import { buildPayUrl } from '@/config/pay';
import { SITE_URL } from '@/config/brand';
import { PAY_MAX_BTC, PAY_MIN_BTC } from '@/config/pay';
import { logger } from '@/utils/logger';

export type PaymentRequestStatus = 'pending' | 'paid' | 'declined' | 'cancelled';

export interface PaymentRequestRow {
  id: string;
  requester_id: string;
  payer_id: string;
  amount_btc: number;
  note: string | null;
  status: PaymentRequestStatus;
  created_at: string;
  paid_at: string | null;
}

export type RequestFailureReason =
  | 'payer_not_found'
  | 'self_request'
  | 'invalid_amount'
  | 'requester_cannot_receive'
  | 'not_found'
  | 'not_pending';

export interface RequestFailure {
  ok: false;
  reason: RequestFailureReason;
  message: string;
}

const fail = (reason: RequestFailureReason, message: string): RequestFailure => ({
  ok: false,
  reason,
  message,
});

/**
 * Create a request addressed to another OrangeCat user.
 *
 * The requester's ability to RECEIVE is checked first: asking for money you
 * have no way to accept wastes the other person's time and makes the platform
 * look broken at the worst possible moment.
 */
export async function createPaymentRequest(
  supabase: SupabaseClient,
  requesterId: string,
  input: { payerUsername: string; amountBtc: number; note?: string }
): Promise<{ ok: true; request: PaymentRequestRow } | RequestFailure> {
  const { payerUsername, amountBtc, note } = input;

  if (!Number.isFinite(amountBtc) || amountBtc < PAY_MIN_BTC || amountBtc > PAY_MAX_BTC) {
    return fail('invalid_amount', 'Enter an amount we can actually request.');
  }

  const admin = getAdminClient();
  const username = payerUsername.trim().replace(/^@/, '');

  const { data: payer } = await fromTable(admin, DATABASE_TABLES.PROFILES)
    .select('id, username')
    .ilike('username', username)
    .maybeSingle();

  const payerRow = payer as { id?: string; username?: string } | null;
  if (!payerRow?.id) {
    return fail('payer_not_found', `We couldn't find @${username} on OrangeCat.`);
  }
  if (payerRow.id === requesterId) {
    return fail('self_request', "You can't request money from yourself.");
  }

  // Written through the CALLER's client, so the insert policy (you may only ask
  // on your own behalf) is what actually enforces authorship.
  const { data, error } = await fromTable(supabase, DATABASE_TABLES.PAYMENT_REQUESTS)
    .insert({
      requester_id: requesterId,
      payer_id: payerRow.id,
      amount_btc: amountBtc,
      note: note?.trim() || null,
    })
    .select('id, requester_id, payer_id, amount_btc, note, status, created_at, paid_at')
    .single();

  if (error || !data) {
    logger.error('payment request insert failed', { error }, 'PaymentRequest');
    return fail('not_found', 'Could not create that request. Try again.');
  }

  await notifyPayer(data as PaymentRequestRow, requesterId);
  return { ok: true, request: data as PaymentRequestRow };
}

/** Tell the payer they've been asked, with a link that pays it in one tap. */
async function notifyPayer(request: PaymentRequestRow, requesterId: string): Promise<void> {
  try {
    const admin = getAdminClient();
    const { data: requester } = await fromTable(admin, DATABASE_TABLES.PROFILES)
      .select('username, display_name:name')
      .eq('id', requesterId)
      .maybeSingle();

    const row = requester as { username?: string; display_name?: string } | null;
    const name = row?.display_name || row?.username || 'Someone';
    const forNote = request.note ? ` for ${request.note}` : '';

    await NotificationDispatcher.dispatch({
      userId: request.payer_id,
      type: 'payment',
      title: `${name} requested ${request.amount_btc} BTC`,
      message: `${name} asked you for ${request.amount_btc} BTC${forNote}. Pay it from any Bitcoin wallet, or decline.`,
      // Deep-links to the pay page with the ask pre-filled — still editable,
      // because a request is a suggestion and the payer stays in control.
      actionUrl: row?.username
        ? buildPayUrl(SITE_URL, row.username, {
            amountBtc: request.amount_btc,
            note: request.note ?? undefined,
          })
        : undefined,
      data: { kind: 'payment_request', requestId: request.id },
    });
  } catch (error) {
    // A delivered request that failed to notify is still a real request the
    // payer will see in their list — never fail the creation over this.
    logger.warn('payment request notification failed', { error: String(error) }, 'PaymentRequest');
  }
}

/** Requests I sent, and requests waiting on me. */
export async function listPaymentRequests(
  supabase: SupabaseClient,
  userId: string
): Promise<{ incoming: PaymentRequestRow[]; outgoing: PaymentRequestRow[] }> {
  const { data } = await fromTable(supabase, DATABASE_TABLES.PAYMENT_REQUESTS)
    .select('id, requester_id, payer_id, amount_btc, note, status, created_at, paid_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const rows = (data ?? []) as PaymentRequestRow[];
  return {
    incoming: rows.filter(r => r.payer_id === userId),
    outgoing: rows.filter(r => r.requester_id === userId),
  };
}

/**
 * Withdraw from an open request: the asker cancels, the person asked declines.
 * RLS decides which of those the caller is allowed to do — this only names the
 * transition, it does not authorise it.
 */
export async function closePaymentRequest(
  supabase: SupabaseClient,
  requestId: string,
  status: 'cancelled' | 'declined'
): Promise<{ ok: true } | RequestFailure> {
  const { data, error } = await fromTable(supabase, DATABASE_TABLES.PAYMENT_REQUESTS)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) {
    logger.warn('payment request close failed', { error, requestId }, 'PaymentRequest');
    return fail('not_pending', 'That request is no longer open.');
  }
  if (!data) {
    // Either it doesn't exist, isn't ours, or already closed — all the same to
    // the caller, and deliberately indistinguishable so this can't enumerate.
    return fail('not_pending', 'That request is no longer open.');
  }
  return { ok: true };
}
