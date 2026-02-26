/**
 * GET /api/orders — List buyer's purchases or seller's sales
 *
 * Query params:
 *   ?role=buyer (default) — shows orders where user is buyer
 *   ?role=seller — shows orders where user is seller
 *   ?status=paid — filter by status
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') || 'buyer';
    const status = searchParams.get('status');

    const roleField = role === 'seller' ? 'seller_id' : 'buyer_id';

    let query = supabase
      .from(DATABASE_TABLES.ORDERS)
      .select('*')
      .eq(roleField, user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch orders', { error, role });
      return apiInternalError('Failed to fetch orders');
    }

    return apiSuccess(data || []);
  } catch (error) {
    logger.error('Orders list error', { error });
    return apiInternalError('Failed to fetch orders');
  }
});
