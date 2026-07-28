/**
 * GET /.well-known/lnurlp/<username> — LNURL-pay discovery for the Lightning
 * address `<username>@orangecat.ch` (LUD-16). Returns the payRequest document
 * pointing at the callback that mints an invoice from the user's OWN wallet.
 * Non-custodial: OrangeCat never holds funds (see lnurl-service).
 */

import { NextResponse } from 'next/server';
import { APP_DOMAIN, SITE_URL } from '@/config/brand';
import {
  resolveLnurlRecipient,
  resolveLnurlWallet,
  buildLnurlMetadata,
  LNURL_MIN_SENDABLE_MSAT,
  LNURL_MAX_SENDABLE_MSAT,
} from '@/domain/lightning-address/lnurl-service';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

/** LNURL protocol errors are HTTP 200 with `{status:'ERROR', reason}`. */
function lnurlError(reason: string) {
  return NextResponse.json({ status: 'ERROR', reason });
}

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const recipient = await resolveLnurlRecipient(username);
    if (!recipient) {
      return lnurlError('No OrangeCat user with that name');
    }

    const wallet = await resolveLnurlWallet(recipient.userId);
    if (!wallet) {
      return lnurlError(`${recipient.displayName} can't receive Lightning payments yet`);
    }

    return NextResponse.json(
      {
        tag: 'payRequest',
        callback: `${SITE_URL}/api/lnurlp/${encodeURIComponent(recipient.username)}/callback`,
        minSendable: LNURL_MIN_SENDABLE_MSAT,
        maxSendable: LNURL_MAX_SENDABLE_MSAT,
        metadata: buildLnurlMetadata(recipient, APP_DOMAIN),
        commentAllowed: 0,
      },
      { headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  } catch (err) {
    logger.error('lnurlp discovery failed', { err: String(err), username }, 'LNURL');
    return lnurlError('Something went wrong');
  }
}
