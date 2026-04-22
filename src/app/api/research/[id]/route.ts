import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  apiForbidden,
  apiBadRequest,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';
import { researchUpdateSchema } from '@/config/entity-configs/research-config';

/* eslint-disable @typescript-eslint/no-explicit-any */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function verifyResearchOwner(supabase: any, id: string, userId: string, extraFields = '') {
  const { data, error } = await (supabase.from(getTableName('research')) as any)
    .select(`user_id${extraFields ? ', ' + extraFields : ''}`)
    .eq('id', id).single();
  if (error) return error.code === 'PGRST116' ? 'not_found' : ('error' as const);
  if (data.user_id !== userId) return 'forbidden' as const;
  return data;
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_REGEX.test(params.id)) return apiBadRequest('Invalid research entity ID');
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: entity, error } = await (supabase.from(getTableName('research')) as any)
      .select('*').eq('id', params.id).single();
    if (error) return error.code === 'PGRST116' ? apiNotFound('Research entity not found') : handleApiError(error);
    if (!entity.is_public && (!user || user.id !== entity.user_id)) return apiForbidden('This research entity is private');

    const [{ data: progressUpdates }, { data: votes }, { data: contributions }] = await Promise.all([
      (supabase.from(DATABASE_TABLES.RESEARCH_PROGRESS_UPDATES) as any).select('*').eq('research_entity_id', params.id).order('created_at', { ascending: false }),
      (supabase.from(DATABASE_TABLES.RESEARCH_VOTES) as any).select('*').eq('research_entity_id', params.id),
      (supabase.from(DATABASE_TABLES.RESEARCH_CONTRIBUTIONS) as any).select('*').eq('research_entity_id', params.id).order('created_at', { ascending: false }),
    ]);

    return apiSuccess({ ...entity, progress_updates: progressUpdates || [], votes: votes || [], contributions: contributions || [] });
  } catch (error) { return handleApiError(error); }
}

export async function PUT(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_REGEX.test(params.id)) return apiBadRequest('Invalid research entity ID');
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return apiUnauthorized();

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));

    const body = await _request.json();
    const parsed = researchUpdateSchema.safeParse(body);
    if (!parsed.success) return apiBadRequest('Invalid request body', parsed.error.flatten().fieldErrors);

    const ownership = await verifyResearchOwner(supabase, params.id, user.id);
    if (ownership === 'not_found') return apiNotFound('Research entity not found');
    if (ownership === 'forbidden') return apiForbidden('You can only update your own research entities');
    if (ownership === 'error') return handleApiError(new Error('DB error'));

    const { data: entity, error: updateError } = await (supabase.from(getTableName('research')) as any)
      .update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', params.id).select().single();
    if (updateError) throw updateError;

    logger.info('Research entity updated', { researchEntityId: params.id, userId: user.id });
    return apiSuccess(entity);
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_REGEX.test(params.id)) return apiBadRequest('Invalid research entity ID');
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return apiUnauthorized();

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));

    const ownership = await verifyResearchOwner(supabase, params.id, user.id, 'funding_raised_btc');
    if (ownership === 'not_found') return apiNotFound('Research entity not found');
    if (ownership === 'forbidden') return apiForbidden('You can only delete your own research entities');
    if (ownership === 'error') return handleApiError(new Error('DB error'));
    if ((ownership as any).funding_raised_btc > 0) return apiForbidden('Cannot delete research entity with funding. Archive instead.');

    const { error: deleteError } = await (supabase.from(getTableName('research')) as any).delete().eq('id', params.id);
    if (deleteError) throw deleteError;

    logger.info('Research entity deleted', { researchEntityId: params.id, userId: user.id });
    return apiSuccess({ deleted: true });
  } catch (error) { return handleApiError(error); }
}
