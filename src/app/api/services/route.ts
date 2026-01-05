import { userServiceSchema } from '@/domain/services/schema';
import { createService } from '@/domain/commerce/service';
import { createEntityListHandler } from '@/lib/api/entityListHandler';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';

// GET /api/services - Get all active services
export const GET = createEntityListHandler({
  entityType: 'service',
  useListHelper: true, // Uses listEntitiesPage for commerce entities
});

// POST /api/services - Create new service
export const POST = createEntityPostHandler({
  entityType: 'service',
  schema: userServiceSchema,
  createEntity: async (userId, data) => {
    return await createService(userId, data as { title: string; category: string; [key: string]: unknown });
  },
});
