import { createServerClient } from '@/lib/supabase/server';
import type { AssetInput } from './schema';
import { DEFAULT_CURRENCY } from '@/config/currencies';
import { getTableName } from '@/config/entity-registry';
import { getOrCreateUserActor } from '@/services/actors/getOrCreateUserActor';

export async function listAssets(userId: string) {
  // Resolve user to actor for ownership filtering
  const actor = await getOrCreateUserActor(userId);

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from(getTableName('asset'))
    .select('id, title, type, status, estimated_value, currency, created_at, verification_status')
    .eq('actor_id', actor.id)
    .order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  return data || [];
}

export async function listAssetsPage(userId: string, limit: number, offset: number) {
  // Resolve user to actor for ownership filtering
  const actor = await getOrCreateUserActor(userId);

  const supabase = await createServerClient();
  const itemsQuery = supabase
    .from(getTableName('asset'))
    .select('id, title, type, status, estimated_value, currency, created_at, verification_status')
    .eq('actor_id', actor.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const countQuery = supabase
    .from(getTableName('asset'))
    .select('*', { count: 'exact', head: true })
    .eq('actor_id', actor.id);

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    itemsQuery,
    countQuery,
  ]);
  if (error) {
    throw error;
  }
  if (countError) {
    throw countError;
  }
  return { items: data || [], total: count || 0 };
}

export async function createAsset(userId: string, input: AssetInput) {
  // Resolve user to actor for ownership
  const actor = await getOrCreateUserActor(userId);

  const supabase = await createServerClient();
  const insertPayload = {
    actor_id: actor.id,
    type: input.type,
    title: input.title,
    description: input.description || null,
    location: input.location || null,
    estimated_value: input.estimated_value ?? null,
    currency: input.currency ?? DEFAULT_CURRENCY,
    documents: input.documents ?? null,
    verification_status: 'unverified' as const,
    status: 'draft' as const,
    public_visibility: false,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(getTableName('asset')) as any)
    .insert([insertPayload])
    .select('id, title, type, status, estimated_value, currency, created_at, verification_status')
    .single();
  if (error) {
    throw error;
  }
  return data;
}
