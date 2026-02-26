import { assetSchema } from '@/domain/assets/schema';
import { createAsset } from '@/domain/assets/service';
import { createEntityListHandler } from '@/lib/api/entityListHandler';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';

// GET /api/assets -> list current user's assets
// Uses generic entity list handler with actor_id ownership
export const GET = createEntityListHandler({
  entityType: 'asset',
  userIdField: 'actor_id',
  requireAuth: true,
  selectColumns:
    'id, title, type, status, estimated_value, currency, created_at, verification_status',
});

// POST /api/assets -> create asset (owner scoped)
export const POST = createEntityPostHandler({
  entityType: 'asset',
  schema: assetSchema,
  useActorOwnership: true,
  createEntity: async (userId, data) => {
    return await createAsset(userId, data as Parameters<typeof createAsset>[1]);
  },
});
