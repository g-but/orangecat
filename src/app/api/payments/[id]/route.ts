/**
 * GET /api/payments/[id]/status — Check payment status
 * POST /api/payments/[id]/buyer-confirm — Buyer confirms "I've paid"
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiBadRequest, apiInternalError } from '@/lib/api/standardResponse';
import { checkPaymentStatus, buyerConfirmPayment } from '@/domain/payments';
import { logger } from '@/utils/logger';

// GET /api/payments/[id]?action=status
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

      if (message.includes('not found') || message.includes('Access denied')) {
        return apiBadRequest(message);
      }

      return apiInternalError('Failed to check payment status');
    }
  }
);

// POST /api/payments/[id] with body { action: 'buyer_confirm' }
export const POST = withAuth(
  async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { user, supabase } = request;
      const { id } = await context.params;
      const body = await request.json();

      if (!id) {
        return apiBadRequest('Payment ID is required');
      }

      if (body.action === 'buyer_confirm') {
        const result = await buyerConfirmPayment(supabase, id, user.id);
        return apiSuccess(result);
      }

      return apiBadRequest('Invalid action. Supported: buyer_confirm');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Confirmation failed';
      logger.error('Buyer confirmation failed', { error });

      if (message.includes('not found')) {
        return apiBadRequest(message);
      }

      return apiInternalError('Failed to confirm payment');
    }
  }
);
