/**
 * Tip service — resolve a person by username and mint a non-custodial Bitcoin
 * tip against THEIR own wallet. A tip is a first-class payment_intent
 * (intent_kind='tip'): it reuses the payment stack's wallet resolution, invoice
 * generation, status polling AND settle path (SSOT), so it pays exactly like any
 * other payment — NWC > Lightning address > on-chain, zero fee, OrangeCat never
 * in the money path — and the recipient gets the standard "you got paid"
 * notification for free when it settles.
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { DATABASE_TABLES } from '@/config/database-tables';
import { resolveUserWallet } from '@/domain/payments/walletResolutionService';
import {
  initiateTip as initiateTipPayment,
  checkPublicPaymentStatus,
} from '@/domain/payments/paymentFlowService';
import type { ResolvedWallet } from '@/domain/payments/types';
import { logger } from '@/utils/logger';

const METHOD_LABELS: Record<ResolvedWallet['method'], string> = {
  nwc: 'Lightning',
  lightning_address: 'Lightning',
  onchain: 'On-chain Bitcoin',
};

interface TipRecipient {
  userId: string;
  username: string;
  displayName: string;
}

async function resolveRecipient(
  supabase: AnySupabaseClient,
  username: string
): Promise<TipRecipient | null> {
  const { data } = await supabase
    .from(DATABASE_TABLES.PROFILES)
    .select('id, username, display_name:name')
    .eq('username', username)
    .maybeSingle();

  const row = data as { id?: string; username?: string; display_name?: string } | null;
  if (!row?.id || !row.username) {
    return null;
  }
  return { userId: row.id, username: row.username, displayName: row.display_name || row.username };
}

export interface TipReceiveInfo {
  canReceive: boolean;
  recipientName: string;
  methodLabel?: string;
}

/** Public, secret-free: can this person receive tips, and via what rail. */
export async function getTipReceiveInfo(
  supabase: AnySupabaseClient,
  username: string
): Promise<TipReceiveInfo | null> {
  const recipient = await resolveRecipient(supabase, username);
  if (!recipient) {
    return null;
  }
  const wallet = await resolveUserWallet(supabase, recipient.userId);
  return {
    canReceive: !!wallet,
    recipientName: recipient.displayName,
    methodLabel: wallet ? METHOD_LABELS[wallet.method] : undefined,
  };
}

export interface TipInvoice {
  /** payment_intents row id — the tipper polls status with this + statusToken. */
  intentId: string;
  /** Opaque bearer token to poll settlement without an account. */
  statusToken: string;
  qrData: string;
  methodLabel: string;
  recipientName: string;
  amountBtc: number;
  expiresInSeconds: number | null;
}

type TipInvoiceResult = { ok: true; invoice: TipInvoice } | { ok: false; error: string };

/**
 * Mint a tip payment request for `amountBtc` to the recipient's own wallet.
 * Persists an entity-less payment_intent so the payment can be tracked, the
 * tipper shown live confirmation, and the recipient notified on settlement.
 */
export async function initiateTip(
  supabase: AnySupabaseClient,
  username: string,
  amountBtc: number
): Promise<TipInvoiceResult> {
  const recipient = await resolveRecipient(supabase, username);
  if (!recipient) {
    return { ok: false, error: 'That person could not be found.' };
  }

  const wallet = await resolveUserWallet(supabase, recipient.userId);
  if (!wallet) {
    return {
      ok: false,
      error: `${recipient.displayName} hasn't set up a wallet to receive Bitcoin tips yet.`,
    };
  }

  try {
    const res = await initiateTipPayment({
      recipientUserId: recipient.userId,
      recipientName: recipient.displayName,
      wallet,
      amountBtc,
    });
    return {
      ok: true,
      invoice: {
        intentId: res.payment_intent.id,
        statusToken: res.status_token,
        qrData: res.qr_data,
        methodLabel: res.method_label,
        recipientName: recipient.displayName,
        amountBtc,
        expiresInSeconds: res.expires_in_seconds,
      },
    };
  } catch (err) {
    logger.error('Failed to initiate tip', { err: String(err), username }, 'Tips');
    return { ok: false, error: 'Could not create a tip request right now. Please try again.' };
  }
}

export type TipStatus = 'pending' | 'paid' | 'expired' | 'failed';

export interface TipStatusResult {
  status: TipStatus;
  paidAt: string | null;
}

/**
 * Poll a tip's settlement using its bearer token. Wraps the generic public
 * payment-status check (NWC lookup / LUD-21 verify / on-chain), collapsing the
 * intent's status vocabulary to what the tip UI needs.
 */
export async function getTipStatus(intentId: string, token: string): Promise<TipStatusResult> {
  const res = await checkPublicPaymentStatus(intentId, token);
  const status: TipStatus =
    res.status === 'paid'
      ? 'paid'
      : res.status === 'expired'
        ? 'expired'
        : res.status === 'failed'
          ? 'failed'
          : 'pending';
  return { status, paidAt: res.paid_at ?? null };
}
