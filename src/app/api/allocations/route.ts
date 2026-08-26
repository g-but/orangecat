/**
 * Allocation API — list + create.
 *
 * Creation goes through CivicAllocationService rather than the generic insert:
 * a directive's meaning lives in its lines, which are a second table, and the
 * generic handler would try to insert `lines` as a column.
 */

import { allocationSchema } from '@/lib/validation';
import { createEntityListHandler } from '@/lib/api/entityListHandler';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';
import { CivicAllocationService } from '@/domain/civic/service';
import type { AllocationFormData } from '@/lib/validation/civic';

// GET /api/allocations — the caller's directives, plus public ones via RLS.
export const GET = createEntityListHandler({
  entityType: 'allocation',
});

// POST /api/allocations — create a directive and its lines together.
export const POST = createEntityPostHandler({
  entityType: 'allocation',
  schema: allocationSchema,
  useActorOwnership: true,
  createEntity: async (_userId, data, supabase) => {
    const service = new CivicAllocationService(supabase);
    // `_resolved_actor_id` is the actor the POST handler resolved and validated
    // (the caller's own, or a group they may act for).
    const { _resolved_actor_id, _resolved_is_test, ...allocation } = data as Record<
      string,
      unknown
    >;
    return service.createWithLines({
      ...(allocation as AllocationFormData),
      actor_id: _resolved_actor_id as string,
    });
  },
});
