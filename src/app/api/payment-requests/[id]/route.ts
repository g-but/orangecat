/**
 * PATCH /api/payment-requests/[id] — withdraw from an open request.
 *
 * The asker cancels, the person asked declines. Neither may mark a request
 * PAID: both parties have an interest in that answer, so it stays a system
 * write made after settlement is observed. RLS enforces which transition the
 * caller is actually allowed to make.
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
import { closePaymentRequest } from '@/domain/payments/paymentRequestService';
import { logger } from '@/utils/logger';

const patchSchema = z.object({ status: z.enum(['cancelled', 'declined']) });

export const PATCH = withAuth(
  async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { user, supabase } = request;

      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {
        return apiRateLimited('Too many updates. Please slow down.', retryAfterSeconds(rl));
      }

      const { id } = await context.params;

      const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
      if (!parsed.success) {
        return apiBadRequest('Invalid request', parsed.error.flatten());
      }

      const result = await closePaymentRequest(supabase, id, parsed.data.status);
      if (!result.ok) {
        return apiBadRequest(result.message, { reason: result.reason });
      }
      return apiSuccess({ id, status: parsed.data.status });
    } catch (error) {
      logger.error('close payment request failed', { error }, 'PaymentRequest');
      return apiInternalError('Could not update that request.');
    }
  }
);
