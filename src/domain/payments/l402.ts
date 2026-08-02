/**
 * HTTP 402 (L402-style) inline payment — speak the standard, not just our dialect.
 *
 * The machine-payments world converged on the status code built for this
 * moment: 402 Payment Required with a Lightning challenge, retried with proof
 * of payment. This module maps that convention onto OrangeCat's existing
 * account-less rails (initiatePublicSupport / public status tokens) — no new
 * state, no accounts, no API keys:
 *
 *   GET /api/v1/pay/{type}/{id}?amount_btc=X
 *     → 402 + `WWW-Authenticate: L402 token="<intentId>.<statusToken>", invoice="<bolt11>"`
 *   …pay the invoice…
 *   GET (same URL) + `Authorization: L402 <intentId>.<statusToken>:<preimage>`
 *     → 200 receipt
 *
 * Proof is cryptographic first: sha256(preimage) must equal the invoice's
 * payment_hash — a valid preimage can only exist if the invoice was paid, so
 * this needs no trust in our own polling. Settlement-status verification is
 * the fallback for rails without a hash (on-chain).
 *
 * Deliberately L402-"lite": the token is our existing public status token,
 * not a macaroon — no caveats, no delegation, same privacy properties as the
 * account-less support flow it wraps.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { DATABASE_TABLES } from '@/config/database-tables';
import { STATUS } from '@/config/database-constants';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  initiatePublicSupport,
  checkPublicPaymentStatus,
  hashPublicStatusToken,
} from './paymentFlowService';
import type { InitiatePublicSupportInput } from './types';

export {
  parseL402Authorization,
  preimageMatchesHash,
  buildL402ChallengeHeader,
  type L402Credentials,
} from './l402-codec';
import { buildL402ChallengeHeader, preimageMatchesHash, type L402Credentials } from './l402-codec';

// ==================== FLOWS ====================

export interface L402Challenge {
  header: string;
  payment_intent_id: string;
  status_token: string;
  bolt11: string | null;
  onchain_address: string | null;
  amount_btc: number;
  expires_in_seconds: number | null;
  method_label: string;
}

/**
 * Open a 402 challenge: create an account-less support intent on the entity
 * (all visibility/wallet rules enforced by initiatePublicSupport) and return
 * the header + body for the 402 response.
 */
export async function createL402Challenge(
  publicSupabase: SupabaseClient,
  input: InitiatePublicSupportInput
): Promise<L402Challenge> {
  const result = await initiatePublicSupport(publicSupabase, input);
  // The public result deliberately omits invoice internals — fetch the
  // challenge fields with the admin client, scoped by the intent we just made.
  const admin = getAdminClient() as unknown as SupabaseClient;
  const { data: intent } = await admin
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .select('bolt11, onchain_address')
    .eq('id', result.payment_intent.id)
    .maybeSingle();

  return {
    header: buildL402ChallengeHeader({
      paymentIntentId: result.payment_intent.id,
      statusToken: result.status_token,
      bolt11: intent?.bolt11 ?? null,
    }),
    payment_intent_id: result.payment_intent.id,
    status_token: result.status_token,
    bolt11: intent?.bolt11 ?? null,
    onchain_address: intent?.onchain_address ?? null,
    amount_btc: Number(result.payment_intent.amount_btc),
    expires_in_seconds: result.expires_in_seconds,
    method_label: result.method_label,
  };
}

export interface L402VerifyResult {
  ok: boolean;
  /** 'preimage' = cryptographic proof; 'settlement' = observed settled status. */
  verified_by?: 'preimage' | 'settlement';
  status: string;
  paid_at: string | null;
}

/**
 * Verify an L402 retry. Preimage proof wins (works even before our poller
 * notices settlement); settled status is the fallback for hashless rails.
 * Throws 'Payment not found' when the token doesn't match — same opacity as
 * the public status endpoint.
 */
export async function verifyL402Payment(creds: L402Credentials): Promise<L402VerifyResult> {
  const admin = getAdminClient() as unknown as SupabaseClient;
  const { data: intent } = await admin
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .select('id, payment_hash, status, paid_at')
    .eq('id', creds.paymentIntentId)
    .eq('public_status_token_hash', hashPublicStatusToken(creds.statusToken))
    .maybeSingle();
  if (!intent) {
    throw new Error('Payment not found');
  }

  if (intent.payment_hash && preimageMatchesHash(creds.preimage, intent.payment_hash)) {
    return {
      ok: true,
      verified_by: 'preimage',
      status: intent.status,
      paid_at: intent.paid_at ?? null,
    };
  }

  // No (or wrong) preimage proof — fall back to live settlement status, which
  // also runs the rail checks (LUD-21 / NWC / chain) and updates the row.
  const refreshed = await checkPublicPaymentStatus(creds.paymentIntentId, creds.statusToken);
  const settled =
    refreshed.status === STATUS.PAYMENT_INTENTS.PAID ||
    refreshed.status === STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED;
  return {
    ok: settled,
    verified_by: settled ? 'settlement' : undefined,
    status: refreshed.status,
    paid_at: refreshed.paid_at ?? null,
  };
}
