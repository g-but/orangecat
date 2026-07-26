import { apiBadRequest, apiNotFound, apiSuccess } from '@/lib/api/standardResponse';
import { getEntityMetadata, isValidEntityType } from '@/config/entity-registry';
import { createPublicClient } from '@/lib/supabase/public';
import { getEntityFundingStats } from '@/services/wallets/funding-stats';

export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await context.params;
  if (!isValidEntityType(type) || !/^[0-9a-f-]{36}$/i.test(id)) {
    return apiBadRequest('Invalid entity');
  }

  const publicClient = createPublicClient();
  const meta = getEntityMetadata(type);
  const { data: visibleEntity } = await publicClient
    .from(meta.tableName)
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!visibleEntity) {
    return apiNotFound('Entity not found');
  }

  const stats = await getEntityFundingStats(publicClient, type, id);
  return apiSuccess(stats, { cache: 'NONE' });
}
