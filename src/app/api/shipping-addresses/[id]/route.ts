/**
 * PUT /api/shipping-addresses/[id] — Update a shipping address
 * DELETE /api/shipping-addresses/[id] — Delete a shipping address
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  apiNoContent,
  apiInternalError,
} from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

export const PUT = withAuth(
  async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { user, supabase } = request;
      const { id } = await context.params;
      const body = await request.json();

      // If setting as default, unset existing defaults first
      if (body.is_default) {
        await supabase
          .from(DATABASE_TABLES.SHIPPING_ADDRESSES)
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const updates: Record<string, unknown> = {};
      if (body.label !== undefined) {
        updates.label = body.label;
      }
      if (body.full_name !== undefined) {
        updates.full_name = body.full_name;
      }
      if (body.street !== undefined) {
        updates.street = body.street;
      }
      if (body.street2 !== undefined) {
        updates.street2 = body.street2;
      }
      if (body.city !== undefined) {
        updates.city = body.city;
      }
      if (body.state !== undefined) {
        updates.state = body.state;
      }
      if (body.postal_code !== undefined) {
        updates.postal_code = body.postal_code;
      }
      if (body.country_code !== undefined) {
        updates.country_code = body.country_code;
      }
      if (body.is_default !== undefined) {
        updates.is_default = body.is_default;
      }

      const { data, error } = await supabase
        .from(DATABASE_TABLES.SHIPPING_ADDRESSES)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // RLS + app-level check
        .select()
        .single();

      if (error || !data) {
        return apiNotFound('Address not found');
      }

      return apiSuccess(data);
    } catch (error) {
      logger.error('Shipping address update error', { error });
      return apiInternalError('Failed to update address');
    }
  }
);

export const DELETE = withAuth(
  async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { user, supabase } = request;
      const { id } = await context.params;

      const { error } = await supabase
        .from(DATABASE_TABLES.SHIPPING_ADDRESSES)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        return apiNotFound('Address not found');
      }

      return apiNoContent();
    } catch (error) {
      logger.error('Shipping address delete error', { error });
      return apiInternalError('Failed to delete address');
    }
  }
);
