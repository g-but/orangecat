/**
 * Circle API Routes — list + create.
 * Generic handlers; entity metadata from entity-registry (SSOT).
 */

import { circleSchema } from '@/lib/validation';
import { createEntityListHandler } from '@/lib/api/entityListHandler';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';

// GET /api/circles - the authenticated actor's circles (plus public ones via RLS).
export const GET = createEntityListHandler({
  entityType: 'circle',
});

// POST /api/circles - create a circle (actor-owned).
export const POST = createEntityPostHandler({
  entityType: 'circle',
  schema: circleSchema,
  useActorOwnership: true,
});
