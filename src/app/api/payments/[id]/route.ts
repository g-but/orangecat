/**
 * GET /api/payments/[id] — Check payment status
 * POST /api/payments/[id] — Perform action on payment (buyer_confirm, cancel, expire)
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiBadRequest,
  apiForbidden,
  apiNotFound,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { checkPaymentStatus, buyerConfirmPayment } from '@/domain/payments';
import { paymentActionSchema } from '@/lib/validation/finance';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';

// GET /api/payments/[id]
export const GET = withAuth(
  async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { user, supabase } = request;
      const { id } = await context.params;

      if (!id) {
        return apiBadRequest('Payment ID is required');
      }

      const result = await checkPaymentStatus(supabase, id, user.id);
      return apiSuccess(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Status check failed';
      logger.error('Payment status check failed', { error });

      if (message.includes('not found')) {
        return apiNotFound('Payment not found');
      }
      if (message.includes('Access denied')) {
        return apiForbidden('Access denied');
      }

      return apiInternalError('Failed to check payment status');
    }
  }
);

// POST /api/payments/[id] with body { action: 'buyer_confirm' | 'cancel' | 'expire' }
export const POST = withAuth(
  async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { user, supabase } = request;
      const { id } = await context.params;

      // Rate limiting
      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {
        const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
        return apiRateLimited('Too many payment requests. Please slow down.', retryAfter);
      }

      const body = await request.json();

      // Zod validation
      const parsed = paymentActionSchema.safeParse(body);
      if (!parsed.success) {
        return apiBadRequest('Invalid input', parsed.error.errors);
      }

      if (!id) {
        return apiBadRequest('Payment ID is required');
      }

      const result = await buyerConfirmPayment(supabase, id, user.id);
      return apiSuccess(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Confirmation failed';
      logger.error('Buyer confirmation failed', { error });

      if (message.includes('not found')) {
        return apiBadRequest('Payment not found');
      }

      return apiInternalError('Failed to confirm payment');
    }
  }
);
