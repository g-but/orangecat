/**
 * GET /api/lnurlp/<username>/callback?amount=<msat> — LNURL-pay callback. Mints a
 * BOLT11 invoice from the user's OWN wallet (NWC make_invoice, or their existing
 * Lightning-address provider) for the requested amount and returns it. The sats
 * settle directly to the user — OrangeCat never touches them (non-custodial).
 * Rate-limited per-IP and per-recipient, like the tip endpoints, so nobody can
 * flood a user's wallet/relay with invoice requests.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { rateLimit, rateLimitTipRecipient } from '@/lib/rate-limit';
import { generateInvoice } from '@/domain/payments/invoiceGenerationService';
import { satsToBitcoin } from '@/services/currency';
import {
  resolveLnurlRecipient,
  resolveLnurlWallet,
  LNURL_MIN_SENDABLE_MSAT,
  LNURL_MAX_SENDABLE_MSAT,
} from '@/domain/lightning-address/lnurl-service';
import { logger } from '@/utils/logger';

/** LNURL protocol errors are HTTP 200 with `{status:'ERROR', reason}`. */
function lnurlError(reason: string) {
  return NextResponse.json({ status: 'ERROR', reason });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  try {
    const ipRl = await rateLimit(request);
    if (!ipRl.success) {
      return lnurlError('Too many requests — try again shortly');
    }
    const recipientRl = await rateLimitTipRecipient(username);
    if (!recipientRl.success) {
      return lnurlError('This recipient is receiving a lot of requests — try again shortly');
    }

    const amountMsat = Number(new URL(request.url).searchParams.get('amount'));
    if (
      !Number.isFinite(amountMsat) ||
      amountMsat < LNURL_MIN_SENDABLE_MSAT ||
      amountMsat > LNURL_MAX_SENDABLE_MSAT
    ) {
      return lnurlError('Amount is missing or out of range');
    }

    const recipient = await resolveLnurlRecipient(username);
    if (!recipient) {
      return lnurlError('No OrangeCat user with that name');
    }
    const wallet = await resolveLnurlWallet(recipient.userId);
    if (!wallet) {
      return lnurlError('This user cannot receive Lightning payments');
    }

    // msat → BTC (1 BTC = 1e8 sat = 1e11 msat). Wallets always send whole sats.
    const amountBtc = satsToBitcoin(Math.floor(amountMsat / 1000));
    const invoice = await generateInvoice(
      wallet,
      amountBtc,
      `Pay ${recipient.displayName} on OrangeCat`
    );
    if (!invoice.bolt11) {
      return lnurlError('Could not create an invoice right now');
    }

    return NextResponse.json({ pr: invoice.bolt11, routes: [] });
  } catch (err) {
    logger.error('lnurlp callback failed', { err: String(err), username }, 'LNURL');
    return lnurlError('Could not create an invoice right now');
  }
}
