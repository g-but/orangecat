/**
 * What `payment_intents.expires_at` actually means.
 *
 * It answers exactly one question: **can a NEW payment still be made?** That is
 * a fact about the rail, not about how long OrangeCat feels like watching.
 *
 * For Lightning the two coincide — a BOLT11 invoice is cryptographically dead
 * after its expiry, so "can't pay" and "stop watching" become true at the same
 * instant. For on-chain they do not: a Bitcoin address never stops accepting
 * money. Money can land in ten minutes or ten days (slow wallet, fee-bump, an
 * exchange withdrawal queue), and it lands in the recipient's wallet whatever
 * our database says.
 *
 * Conflating the two is how money goes missing. A fabricated on-chain deadline
 * makes the record terminal, the reconciliation sweep skips terminal rows, and
 * a late payment then settles with no record at all: no recipient notification,
 * no contribution row, funding totals frozen at zero. That is precisely the
 * failure the sweep exists to prevent, surviving in the one rail where it is
 * most likely — because on-chain is the slow rail.
 *
 * Bounding what we watch is a separate, legitimate concern. It belongs in the
 * sweeper (see the on-chain watch horizon in /api/cron/payment-reconcile),
 * where "we stopped asking" stays an operational choice rather than a claim
 * written into the record that no payment arrived.
 */

import type { PaymentMethod } from './types';

/**
 * Fallback deadline for rails that DO expire, used only if the provider did not
 * state one. Both Lightning paths set an explicit expiry today, so this is a
 * safety net rather than a live default.
 */
export const LIGHTNING_FALLBACK_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Which rails have a deadline at all. Exhaustive by construction: adding a
 * payment method fails the build here until someone decides whether money can
 * still arrive after the clock runs out.
 */
const RAIL_HAS_DEADLINE: Record<PaymentMethod, boolean> = {
  nwc: true,
  lightning_address: true,
  // A Bitcoin address is valid forever — there is no moment after which paying
  // it stops working, so there is no honest expiry to record.
  onchain: false,
};

/**
 * The single decision of when (or whether) an intent expires, shared by every
 * creation path. Authenticated checkout and the account-free support/tip flows
 * must not disagree about the same rail — they did before this existed: authed
 * on-chain never expired while public on-chain was given an hour.
 */
export function resolveIntentExpiry(
  method: PaymentMethod,
  invoiceExpiresAt: string | null
): string | null {
  if (!RAIL_HAS_DEADLINE[method]) {
    return null;
  }
  return invoiceExpiresAt ?? new Date(Date.now() + LIGHTNING_FALLBACK_EXPIRY_MS).toISOString();
}

/**
 * How long after invoice expiry a buyer's "I've paid" claim is still accepted
 * (bare Lightning addresses only — the rail with no automatic detection).
 *
 * Expiry bounds when a payment can be MADE, not when it can be REPORTED. A
 * payer who paid seconds before the bolt11 died and reopened the page an hour
 * later was told "this payment request has expired" — the product refusing
 * testimony about money that may genuinely have moved. The claim is only ever
 * testimony: the recipient's confirmation is what settles it, so accepting a
 * late claim risks nothing but a confirm-request the recipient can decline.
 *
 * The window is bounded (not infinite) so stale links can't generate
 * confirm-request noise indefinitely — and so undetectable intents can
 * eventually be terminalized honestly: once the invoice is dead AND the claim
 * window has closed, "expired" states a fact rather than a guess.
 */
export const BUYER_CLAIM_GRACE_MS = 48 * 60 * 60 * 1000;

/** True once expires_at + the claim window are both in the past. */
export function isBeyondClaimWindow(expiresAt: string | null, now = Date.now()): boolean {
  if (!expiresAt) {
    return false;
  }
  return now > new Date(expiresAt).getTime() + BUYER_CLAIM_GRACE_MS;
}

/**
 * Countdown for the payer's QR, or null when there is nothing to count down to.
 *
 * Null must stay null all the way to the UI: coercing "no deadline" to 0 would
 * render an on-chain QR as already expired, telling the payer their perfectly
 * valid address is dead.
 */
export function expiresInSecondsFrom(expiresAt: string | null): number | null {
  if (!expiresAt) {
    return null;
  }
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}
