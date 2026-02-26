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
} from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

export const GET = withAuth(
  async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { user, supabase } = request;
      const { id } = await context.params;

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
      const { id } = await context.params;
      const body = await request.json();

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
