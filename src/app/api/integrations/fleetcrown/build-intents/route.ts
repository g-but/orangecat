import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiBadRequest,
  apiForbidden,
  apiServiceUnavailable,
  apiSuccess,
} from '@/lib/api/standardResponse';
import { getEntityMetadata, isValidEntityType } from '@/config/entity-registry';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSellerUserId } from '@/domain/payments';
import { getOrCreateUserActor } from '@/services/actors/getOrCreateUserActor';
import { signFleetCrownBuildIntent, suggestedHandoffFor } from '@/services/fleetcrown/build-intent';
import { ECOSYSTEM } from '@/config/ecosystem';
import type { AnySupabaseClient } from '@/lib/supabase/types';

const NON_ACTIONABLE = new Set(['wallet', 'document']);

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const body = (await request.json()) as {
    entity_type?: string;
    entity_id?: string;
    source_path?: string;
  };
  if (
    !body.entity_type ||
    !isValidEntityType(body.entity_type) ||
    !body.entity_id ||
    !/^[0-9a-f-]{36}$/i.test(body.entity_id) ||
    !body.source_path?.startsWith('/') ||
    body.source_path.startsWith('//') ||
    NON_ACTIONABLE.has(body.entity_type)
  ) {
    return apiBadRequest('Invalid build handoff');
  }

  const entityType = body.entity_type;
  const ownerId = await getSellerUserId(request.supabase, entityType, body.entity_id);
  if (ownerId !== request.user.id) {
    return apiForbidden('Only the entity owner can send it to FleetCrown');
  }

  const meta = getEntityMetadata(entityType);
  const titleColumn = meta.titleColumn ?? 'title';
  const admin = getAdminClient() as unknown as AnySupabaseClient;
  const { data: entity } = await admin
    .from(meta.tableName)
    .select(`id, ${titleColumn}, description`)
    .eq('id', body.entity_id)
    .maybeSingle();
  if (!entity) {
    return apiBadRequest('Entity not found');
  }

  const row = entity as unknown as Record<string, unknown>;
  const title = String(row[titleColumn] || meta.name);
  const description = typeof row.description === 'string' ? row.description.slice(0, 1200) : null;
  const actor = await getOrCreateUserActor(request.user.id);
  let token: string;
  try {
    token = signFleetCrownBuildIntent({
      sub: actor.id,
      entity: {
        type: entityType,
        id: body.entity_id,
        title,
        description,
        publicUrl: new URL(body.source_path, ECOSYSTEM.orangeCat.siteUrl).toString(),
      },
      suggestedHandoff: suggestedHandoffFor(entityType, title),
    });
  } catch {
    // FLEETCROWN_BUILD_INTENT_SECRET not set on this deploy — the handoff is
    // unavailable, not a server fault. Return 503 so the CTA can fall back to
    // the plain FleetCrown link instead of surfacing a generic 500.
    return apiServiceUnavailable('FleetCrown build handoff is not configured');
  }

  const url = new URL('/integrations/orangecat/build', ECOSYSTEM.fleetCrown.siteUrl);
  url.searchParams.set('intent', token);
  return apiSuccess({ url: url.toString(), expires_in_seconds: 600 });
});
