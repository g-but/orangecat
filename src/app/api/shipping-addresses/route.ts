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
} from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

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
    const body = await request.json();

    // Basic validation
    if (!body.full_name || !body.street || !body.city || !body.postal_code) {
      return apiBadRequest('full_name, street, city, and postal_code are required');
    }

    // If this is the first address or marked as default, unset existing defaults
    if (body.is_default) {
      await supabase
        .from(DATABASE_TABLES.SHIPPING_ADDRESSES)
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabase
      .from(DATABASE_TABLES.SHIPPING_ADDRESSES)
      .insert({
        user_id: user.id,
        label: body.label || null,
        full_name: body.full_name,
        street: body.street,
        street2: body.street2 || null,
        city: body.city,
        state: body.state || null,
        postal_code: body.postal_code,
        country_code: body.country_code || 'CH',
        is_default: body.is_default ?? false,
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
