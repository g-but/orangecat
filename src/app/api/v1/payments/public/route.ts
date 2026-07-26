import {
  apiBadRequest,
  apiInternalError,
  apiRateLimited,
  apiSuccess,
} from '@/lib/api/standardResponse';
import { initiatePublicSupport } from '@/domain/payments';
import { publicSupportCreateSchema } from '@/lib/validation/finance';
import { createPublicClient } from '@/lib/supabase/public';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';

function requestKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return `public-support:${forwarded || request.headers.get('x-real-ip') || 'anonymous'}`;
}

export async function POST(request: Request) {
  const limit = await rateLimitWriteAsync(requestKey(request));
  if (!limit.success) {
    return apiRateLimited(
      'Too many payment requests. Please try again shortly.',
      retryAfterSeconds(limit)
    );
  }

  try {
    const parsed = publicSupportCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiBadRequest('Invalid support request', parsed.error.errors);
    }

    const result = await initiatePublicSupport(createPublicClient(), parsed.data);
    return apiSuccess(result, { status: 201, cache: 'NONE' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment initiation failed';
    logger.error('Public support initiation failed', { error });

    const safeErrors: Array<[string, string]> = [
      ['not publicly available', 'This page is not available for public support.'],
      ['cannot receive', 'This kind of page cannot receive public support.'],
      ['owner not found', 'This page no longer has a receiving owner.'],
      ['no wallet', 'The owner has not connected a Bitcoin wallet yet.'],
      ['outside allowed range', 'That amount is outside the wallet provider’s allowed range.'],
      ['LNURL', 'The Lightning Address could not create an invoice. Try again later.'],
    ];
    for (const [pattern, safe] of safeErrors) {
      if (message.toLowerCase().includes(pattern.toLowerCase())) {
        return apiBadRequest(safe);
      }
    }
    return apiInternalError('Could not create the Bitcoin payment request.');
  }
}
