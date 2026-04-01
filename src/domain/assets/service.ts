import { listEntityPage, createEntity } from '@/domain/base/entityService';
import type { AssetInput } from './schema';
import { DEFAULT_CURRENCY } from '@/config/currencies';
import { STATUS } from '@/config/database-constants';
import { getOrCreateUserActor } from '@/services/actors/getOrCreateUserActor';
import { createServerClient } from '@/lib/supabase/server';
import { getTableName } from '@/config/entity-registry';

const ASSET_SELECT =
  'id, title, type, status, estimated_value, currency, created_at, verification_status';

export async function listAssets(userId: string) {
  // listAssets returns all items for the owner (no pagination, no status filter)
  const actor = await getOrCreateUserActor(userId);
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from(getTableName('asset'))
    .select(ASSET_SELECT)
    .eq('actor_id', actor.id)
    .order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  return data || [];
}

export async function listAssetsPage(userId: string, limit: number, offset: number) {
  return listEntityPage('asset', {
    limit,
    offset,
    userId,
    includeOwnDrafts: true,
    select: ASSET_SELECT,
  });
}

export async function createAsset(userId: string, input: AssetInput) {
  return createEntity(
    'asset',
    userId,
    {
      type: input.type,
      title: input.title,
      description: input.description || null,
      location: input.location || null,
      estimated_value: input.estimated_value ?? null,
      currency: input.currency ?? DEFAULT_CURRENCY,
      documents: input.documents ?? null,
      verification_status: 'unverified' as const,
      status: STATUS.ASSETS.DRAFT,
      public_visibility: false,
    },
    {
      select: ASSET_SELECT,
    }
  );
}
