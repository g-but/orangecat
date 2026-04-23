/**
 * PUT /api/shipping-addresses/[id] — Update a shipping address
 * DELETE /api/shipping-addresses/[id] — Delete a shipping address
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  apiNoContent,
  apiBadRequest,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { shippingAddressSchema } from '../route';

export const PUT = withAuth(
  async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const idValidation = getValidationError(validateUUID(id, 'address ID'));
    if (idValidation) {return idValidation;}
    try {
      const { user, supabase } = request;

      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {
        const retryAfter = retryAfterSeconds(rl);
        return apiRateLimited('Too many requests. Please slow down.', retryAfter);
      }

      const body = await request.json();

      const parsed = shippingAddressSchema.partial().safeParse(body);
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        return apiBadRequest(first?.message || 'Invalid address data');
      }
      const addr = parsed.data;

      // If setting as default, unset existing defaults first
      if (addr.is_default) {
        await supabase
          .from(DATABASE_TABLES.SHIPPING_ADDRESSES)
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const updates: Record<string, unknown> = {};
      if (addr.label !== undefined) { updates.label = addr.label; }
      if (addr.full_name !== undefined) { updates.full_name = addr.full_name; }
      if (addr.street !== undefined) { updates.street = addr.street; }
      if (addr.street2 !== undefined) { updates.street2 = addr.street2; }
      if (addr.city !== undefined) { updates.city = addr.city; }
      if (addr.state !== undefined) { updates.state = addr.state; }
      if (addr.postal_code !== undefined) { updates.postal_code = addr.postal_code; }
      if (addr.country_code !== undefined) { updates.country_code = addr.country_code; }
      if (addr.is_default !== undefined) { updates.is_default = addr.is_default; }

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
    const { id } = await context.params;
    const idValidation = getValidationError(validateUUID(id, 'address ID'));
    if (idValidation) {return idValidation;}
    try {
      const { user, supabase } = request;

      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {
        const retryAfter = retryAfterSeconds(rl);
        return apiRateLimited('Too many requests. Please slow down.', retryAfter);
      }

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
