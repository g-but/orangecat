/**
 * POST /api/send — pay someone from the authenticated user's own wallet.
 *
 * Two shapes, because there are two ways you get asked for money: a person
 * (`{recipient, amount_btc}`) or an invoice someone handed you
 * (`{invoice}` — pasted or scanned, amount read from the invoice itself).
 *
 * This route only ever spends the CALLER's wallet: the sender is taken from the
 * session, never from the request body, so no input can redirect whose money
 * moves. Rate-limited as a write because each call really does move funds.
 */

import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiBadRequest,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import {
  payInvoice,
  sendToRecipient,
  resolveSenderNwcUri,
} from '@/domain/payments/sendPaymentService';
import { PAY_MAX_BTC, PAY_MIN_BTC } from '@/config/pay';
import { SEND_NOTE_MAX_LENGTH } from '@/config/send';
import { logger } from '@/utils/logger';

const bodySchema = z.union([
  z.object({
    invoice: z.string().min(1).max(2000),
  }),
  z.object({
    recipient: z.string().min(1).max(255),
    amount_btc: z.number().positive().min(PAY_MIN_BTC).max(PAY_MAX_BTC),
    memo: z.string().max(SEND_NOTE_MAX_LENGTH).optional(),
  }),
]);

/**
 * GET /api/send — can this user send at all?
 *
 * The screen used to let someone fill in a recipient, an amount and a note
 * before finding out, on the final tap, that they have no wallet to send from.
 * That is the worst moment to say it: the work is done and the answer was
 * knowable before a single keystroke.
 *
 * Answered by running the SAME resolution the payment runs — never by guessing
 * from the presence of a wallet row, which is how a UI ends up promising a
 * capability the payment path then refuses. The decrypted connection is used to
 * prove readability and discarded; nothing about it is returned.
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const resolved = await resolveSenderNwcUri(request.user.id);
  return typeof resolved === 'string'
    ? apiSuccess({ canSend: true })
    : apiSuccess({ canSend: false, reason: resolved.reason, message: resolved.message });
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      return apiRateLimited('Too many payment attempts. Please slow down.', retryAfterSeconds(rl));
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return apiBadRequest('Invalid request', parsed.error.flatten());
    }

    const result =
      'invoice' in parsed.data
        ? await payInvoice(user.id, parsed.data.invoice)
        : await sendToRecipient(
            user.id,
            parsed.data.recipient,
            parsed.data.amount_btc,
            parsed.data.memo
          );

    if (!result.ok) {
      // Every failure here is something the payer can read and act on, so the
      // domain's message is passed through rather than flattened to a generic.
      return apiBadRequest(result.message, { reason: result.reason });
    }

    return apiSuccess({
      paymentHash: result.paymentHash,
      amountBtc: result.amountBtc,
      destination: result.destination,
    });
  } catch (error) {
    logger.error('send failed', { error }, 'Send');
    return apiInternalError('Could not complete the payment.');
  }
});
