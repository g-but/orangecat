import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiBadRequest, apiForbidden, apiSuccess } from '@/lib/api/standardResponse';
import { isValidEntityType } from '@/config/entity-registry';
import { getSellerUserId } from '@/domain/payments';
import { DATABASE_TABLES } from '@/config/database-tables';
import { STATUS } from '@/config/database-constants';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const entityType = request.nextUrl.searchParams.get('entity_type');
  const entityId = request.nextUrl.searchParams.get('entity_id');
  if (!entityType || !isValidEntityType(entityType) || !entityId) {
    return apiBadRequest('Invalid entity');
  }
  const sellerId = await getSellerUserId(request.supabase, entityType, entityId);
  if (sellerId !== request.user.id) {
    return apiForbidden('Only the recipient can review confirmations');
  }

  const { data, error } = await request.supabase
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .select('id, amount_btc, description, created_at')
    .eq('seller_id', request.user.id)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('status', STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) {
    throw error;
  }
  return apiSuccess(data ?? [], { cache: 'NONE' });
});
