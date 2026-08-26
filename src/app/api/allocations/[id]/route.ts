/**
 * Allocation CRUD API (GET/PUT/DELETE by id).
 *
 * The generic CRUD handler covers the directive itself. Lines are a separate
 * table with their own arithmetic rule, so `lines` is deliberately NOT in the
 * update payload — a PUT that quietly dropped it would look like it had saved a
 * split it never touched. Lines are written through
 * PUT /api/allocations/[id]/lines.
 */

import { allocationSchema } from '@/lib/validation';
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import {
  createUpdatePayloadBuilder,
  commonFieldMappings,
  entityTransforms,
} from '@/lib/api/buildUpdatePayload';
import { CivicAllocationService } from '@/domain/civic/service';

const buildAllocationUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'description', transform: entityTransforms.emptyStringToNull },
  { from: 'basis' },
  { from: 'cadence' },
  { from: 'period_start', transform: entityTransforms.emptyStringToNull },
  { from: 'period_end', transform: entityTransforms.emptyStringToNull },
  { from: 'reference_amount' },
  { from: 'currency' },
  { from: 'residency_jurisdiction_id', transform: entityTransforms.normalizeUUID },
  { from: 'rationale', transform: entityTransforms.emptyStringToNull },
  { from: 'visibility' },
  { from: 'show_on_profile' },
  commonFieldMappings.arrayField('tags', []),
  // No default: a partial PUT must never silently re-activate a paused
  // directive, nor publish a draft the owner had not finished balancing.
  { from: 'status' },
]);

const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'allocation',
  schema: allocationSchema,
  buildUpdatePayload: buildAllocationUpdatePayload,
  ownershipField: 'actor_id',
  useActorOwnership: true,
  // A directive read without its lines is a title and a rationale with nothing
  // to argue about, so every GET carries them.
  postProcessGet: async (entity, _userId, supabase) => {
    const service = new CivicAllocationService(supabase);
    const lines = await service.getResolvedLines(entity.id as string);
    return { ...entity, lines };
  },
});

export { GET, PUT, DELETE };
