/**
 * Jurisdiction API — list + create.
 * Generic handlers; entity metadata from entity-registry (SSOT).
 */

import { jurisdictionSchema } from '@/lib/validation';
import { createEntityListHandler } from '@/lib/api/entityListHandler';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';

// GET /api/jurisdictions — the public directory of government bodies.
export const GET = createEntityListHandler({
  entityType: 'jurisdiction',
  orderBy: 'title',
  orderDirection: 'asc',
});

// POST /api/jurisdictions — add a body to the directory.
//
// Anyone signed in may add one, and every new row lands `unclaimed` (the column
// default; the schema refuses any other value from a form). That is the honest
// bootstrap for a directory: the community lists the bodies, and a body becomes
// payable only when it claims its own page and the evidence is reviewed
// server-side.
export const POST = createEntityPostHandler({
  entityType: 'jurisdiction',
  schema: jurisdictionSchema,
  useActorOwnership: false,
  transformData: (data, userId) => ({
    ...data,
    created_by: userId,
    // actor_id stays NULL: adding a body to the directory is not claiming it.
    actor_id: null,
    parent_id: data.parent_id || null,
    country_code: data.country_code || null,
    official_url: data.official_url || null,
    budget_url: data.budget_url || null,
  }),
});
