import {
  apiBadRequest,
  apiInternalError,
  apiNotFound,
  apiPaymentRequired,
  apiRateLimited,
  apiSuccess,
} from '@/lib/api/standardResponse';
import { createL402Challenge, verifyL402Payment } from '@/domain/payments/l402';
import { parseL402Authorization } from '@/domain/payments/l402-codec';
import { publicSupportCreateSchema } from '@/lib/validation/finance';
import { createPublicClient } from '@/lib/supabase/public';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';

/**
 * GET /api/v1/pay/{entity_type}/{entity_id}?amount_btc=X — HTTP 402 inline payment.
 *
 * The standards-shaped face of the machine-payable flow (L402-style, see
 * domain/payments/l402.ts): no account, no API key —
 *   1. GET without Authorization → 402 Payment Required, WWW-Authenticate
 *      carries `token` + Lightning `invoice`; body mirrors the challenge.
 *   2. Pay the invoice with any Lightning wallet.
 *   3. GET again with `Authorization: L402 <token>:<preimage>` → 200 receipt
 *      (preimage verified against the invoice's payment_hash; settlement
 *      status is the fallback for on-chain).
 *
 * The JSON-contract flow (POST /api/v1/payments + polling) remains the
 * account-based sibling; this one exists so foreign agents that only speak
 * 402 can pay without learning our dialect.
 */

function requestKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return `l402:${forwarded || request.headers.get('x-real-ip') || 'anonymous'}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entity_type: string; entity_id: string }> }
) {
  const { entity_type, entity_id } = await params;

  // Retry-with-proof branch first: verification is cheap and shouldn't share
  // the challenge-creation rate budget.
  const creds = parseL402Authorization(request.headers.get('authorization'));
  if (creds) {
    try {
      const result = await verifyL402Payment(creds);
      if (result.ok) {
        return apiSuccess(
          {
            status: result.status,
            paid_at: result.paid_at,
            verified_by: result.verified_by,
            entity_type,
            entity_id,
          },
          { cache: 'NONE' }
        );
      }
      // Not paid yet — 402 again. The client already holds the invoice from
      // the original challenge, so no new intent is created here.
      return apiPaymentRequired('Invoice not paid yet — pay it, then retry with the preimage.', {
        status: result.status,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('not found')) {
        return apiNotFound('Payment not found');
      }
      logger.error('L402 verification failed', { error });
      return apiInternalError('Could not verify the payment.');
    }
  }

  // Challenge branch: create an account-less intent and answer 402.
  const limit = await rateLimitWriteAsync(requestKey(request));
  if (!limit.success) {
    return apiRateLimited(
      'Too many payment requests. Try again shortly.',
      retryAfterSeconds(limit)
    );
  }

  const url = new URL(request.url);
  const parsed = publicSupportCreateSchema.safeParse({
    entity_type,
    entity_id,
    amount_btc: Number(url.searchParams.get('amount_btc')),
  });
  if (!parsed.success) {
    return apiBadRequest(
      'Invalid payment request — pass ?amount_btc= between 0.000001 and 1.',
      parsed.error.errors
    );
  }

  try {
    const challenge = await createL402Challenge(createPublicClient(), parsed.data);
    return apiPaymentRequired(
      'Pay the invoice, then retry with Authorization: L402 <token>:<preimage>.',
      {
        payment_intent_id: challenge.payment_intent_id,
        token: `${challenge.payment_intent_id}.${challenge.status_token}`,
        bolt11: challenge.bolt11,
        onchain_address: challenge.onchain_address,
        amount_btc: challenge.amount_btc,
        method_label: challenge.method_label,
        expires_in_seconds: challenge.expires_in_seconds,
      },
      challenge.header
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment initiation failed';
    logger.error('L402 challenge creation failed', { error, entity_type, entity_id });
    // Same safe-error surface as the public support route — never leak internals.
    const safeErrors: Array<[string, string]> = [
      ['not publicly available', 'This entity is not available for public payment.'],
      ['cannot receive', 'This kind of entity cannot receive payments.'],
      ['owner not found', 'This entity no longer has a receiving owner.'],
      ['no wallet', 'The owner has not connected a Bitcoin wallet yet.'],
      ['outside allowed range', 'That amount is outside the wallet provider’s allowed range.'],
      ['LNURL', 'The Lightning Address could not create an invoice. Try again later.'],
    ];
    for (const [pattern, safe] of safeErrors) {
      if (message.toLowerCase().includes(pattern.toLowerCase())) {
        return apiBadRequest(safe);
      }
    }
    return apiInternalError('Could not create the payment challenge.');
  }
}
