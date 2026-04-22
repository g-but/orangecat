/**
 * GET /api/shipping-addresses — List user's shipping addresses
 * POST /api/shipping-addresses — Create a new shipping address
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { z } from 'zod';

export const shippingAddressSchema = z.object({
  label: z.string().max(100).optional().nullable(),
  full_name: z.string().min(1, 'Full name is required').max(100),
  street: z.string().min(1, 'Street is required').max(200),
  street2: z.string().max(200).optional().nullable(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().max(100).optional().nullable(),
  postal_code: z.string().min(1, 'Postal code is required').max(20),
  country_code: z.string().length(2).default('CH'),
  is_default: z.boolean().default(false),
});

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const { data, error } = await supabase
      .from(DATABASE_TABLES.SHIPPING_ADDRESSES)
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch shipping addresses', { error });
      return apiInternalError('Failed to fetch addresses');
    }

    return apiSuccess(data || []);
  } catch (error) {
    logger.error('Shipping addresses list error', { error });
    return apiInternalError('Failed to fetch addresses');
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const body = await request.json();

    const parsed = shippingAddressSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return apiBadRequest(first?.message || 'Invalid address data');
    }
    const addr = parsed.data;

    // If this is the first address or marked as default, unset existing defaults
    if (addr.is_default) {
      await supabase
        .from(DATABASE_TABLES.SHIPPING_ADDRESSES)
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabase
      .from(DATABASE_TABLES.SHIPPING_ADDRESSES)
      .insert({
        user_id: user.id,
        label: addr.label ?? null,
        full_name: addr.full_name,
        street: addr.street,
        street2: addr.street2 ?? null,
        city: addr.city,
        state: addr.state ?? null,
        postal_code: addr.postal_code,
        country_code: addr.country_code,
        is_default: addr.is_default,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create shipping address', { error });
      return apiInternalError('Failed to create address');
    }

    return apiCreated(data);
  } catch (error) {
    logger.error('Shipping address creation error', { error });
    return apiInternalError('Failed to create address');
  }
});
