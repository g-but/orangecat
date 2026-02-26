/**
 * Cause API Routes
 *
 * Uses generic entity handlers for maximum modularity and DRY principles.
 * Entity metadata comes from entity-registry (Single Source of Truth)
 *
 * Refactored: 2025-12-25 from 130 lines to ~60 lines (54% reduction)
 * Refactored: 2026-01-04 to use generic list handler (further reduction)
 */

import { userCauseSchema } from '@/domain/causes/schema';
import { createCause } from '@/domain/commerce/service';
import { createEntityListHandler } from '@/lib/api/entityListHandler';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';

// GET /api/causes - Get all active causes
export const GET = createEntityListHandler({
  entityType: 'cause',
  userIdField: 'actor_id',
  useListHelper: true, // Uses listEntitiesPage for commerce entities
});

// POST /api/causes - Create new cause
export const POST = createEntityPostHandler({
  entityType: 'cause',
  schema: userCauseSchema,
  useActorOwnership: true,
  createEntity: async (userId, data) => {
    return await createCause(
      userId,
      data as { title: string; cause_category: string; [key: string]: unknown }
    );
  },
});
