/**
 * GET /api/orders/[id] — Get order detail
 * PUT /api/orders/[id] — Update order (ship, complete)
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiForbidden,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { z } from 'zod';

const orderUpdateSchema = z.object({
  action: z.enum(['ship', 'complete']),
  tracking_number: z.string().max(200).optional(),
  tracking_url: z.string().url().max(500).optional(),
  seller_note: z.string().max(500).optional(),
});

export const GET = withAuth(
  async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { user, supabase } = request;
      const { id } = await context.params;
      const idValidation = getValidationError(validateUUID(id, 'order ID'));
      if (idValidation) { return idValidation; }

      const { data: order, error } = await supabase
        .from(DATABASE_TABLES.ORDERS)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !order) {
        return apiNotFound('Order not found');
      }

      // RLS handles access, but double-check
      if (order.buyer_id !== user.id && order.seller_id !== user.id) {
        return apiForbidden('Access denied');
      }

      return apiSuccess(order);
    } catch (error) {
      logger.error('Order detail error', { error });
      return apiInternalError('Failed to fetch order');
    }
  }
);

export const PUT = withAuth(
  async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { user, supabase } = request;

      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {
        const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
        return apiRateLimited('Too many requests. Please slow down.', retryAfter);
      }
      const { id } = await context.params;
      const idValidation2 = getValidationError(validateUUID(id, 'order ID'));
      if (idValidation2) { return idValidation2; }
      const rawBody = await request.json();
      const parsed = orderUpdateSchema.safeParse(rawBody);
      if (!parsed.success) {return apiBadRequest(parsed.error.errors[0]?.message || 'Invalid order update data');}
      const body = parsed.data;

      // Fetch order
      const { data: order } = await supabase
        .from(DATABASE_TABLES.ORDERS)
        .select('*')
        .eq('id', id)
        .single();

      if (!order) {
        return apiNotFound('Order not found');
      }

      const { action } = body;

      // Seller marks as shipped
      if (action === 'ship') {
        if (order.seller_id !== user.id) {
          return apiForbidden('Only the seller can mark an order as shipped');
        }
        if (order.status !== 'paid') {
          return apiBadRequest('Order must be in "paid" status to ship');
        }

        const updates: Record<string, unknown> = { status: 'shipped' };
        if (body.tracking_number) {
          updates.tracking_number = body.tracking_number;
        }
        if (body.tracking_url) {
          updates.tracking_url = body.tracking_url;
        }
        if (body.seller_note) {
          updates.seller_note = body.seller_note;
        }

        const { data, error } = await supabase
          .from(DATABASE_TABLES.ORDERS)
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return apiInternalError('Failed to update order');
        }

        return apiSuccess(data);
      }

      // Buyer confirms receipt
      if (action === 'complete') {
        if (order.buyer_id !== user.id) {
          return apiForbidden('Only the buyer can confirm receipt');
        }
        if (order.status !== 'shipped') {
          return apiBadRequest('Order must be in "shipped" status to complete');
        }

        const { data, error } = await supabase
          .from(DATABASE_TABLES.ORDERS)
          .update({ status: 'completed' })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return apiInternalError('Failed to update order');
        }

        return apiSuccess(data);
      }

      return apiBadRequest('Invalid action. Supported: ship, complete');
    } catch (error) {
      logger.error('Order update error', { error });
      return apiInternalError('Failed to update order');
    }
  }
);
