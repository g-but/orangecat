import {
  apiBadRequest,
  apiNotFound,
  apiRateLimited,
  apiSuccess,
} from '@/lib/api/standardResponse';
import {
  acknowledgePublicPayment,
  checkPublicPaymentStatus,
} from '@/domain/payments';
import { publicPaymentActionSchema } from '@/lib/validation/finance';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { clientIpKey } from '@/lib/client-ip';

// Same per-IP keying as ../route.ts — anonymous callers, so IP is the only handle.
function requestKey(request: Request): string {
  return `public-payment-action:${clientIpKey(request)}`;
}

function readToken(request: Request): string | null {
  const token = request.headers.get('x-payment-token');
  return token && token.length >= 32 && token.length <= 128 ? token : null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const idError = getValidationError(validateUUID(id, 'payment ID'));
  if (idError) {
    return idError;
  }
  const token = readToken(request);
  if (!token) {
    return apiNotFound('Payment not found');
  }

  try {
    return apiSuccess(await checkPublicPaymentStatus(id, token), { cache: 'NONE' });
  } catch {
    return apiNotFound('Payment not found');
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const limit = await rateLimitWriteAsync(requestKey(request));
  if (!limit.success) {
    return apiRateLimited(
      'Too many payment requests. Please try again shortly.',
      retryAfterSeconds(limit)
    );
  }

  const { id } = await context.params;
  const idError = getValidationError(validateUUID(id, 'payment ID'));
  if (idError) {
    return idError;
  }
  const token = readToken(request);
  if (!token) {
    return apiNotFound('Payment not found');
  }

  const parsed = publicPaymentActionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiBadRequest('Invalid payment action', parsed.error.errors);
  }

  try {
    return apiSuccess(await acknowledgePublicPayment(id, token), { cache: 'NONE' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('automatically')) {
      return apiBadRequest('This payment is confirmed automatically.');
    }
    if (message.includes('expired')) {
      return apiBadRequest('This payment request has expired.');
    }
    return apiNotFound('Payment not found');
  }
}
