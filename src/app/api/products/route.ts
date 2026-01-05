import { userProductSchema } from '@/domain/products/schema';
import { createProduct } from '@/domain/commerce/service';
import { createEntityListHandler } from '@/lib/api/entityListHandler';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';

// GET /api/products - Get all active products
export const GET = createEntityListHandler({
  entityType: 'product',
  useListHelper: true, // Uses listEntitiesPage for commerce entities
});

// POST /api/products - Create new product
export const POST = createEntityPostHandler({
  entityType: 'product',
  schema: userProductSchema,
  createEntity: async (userId, data, supabase) => {
    return await createProduct(userId, data as { title: string; price: number; [key: string]: unknown }, supabase);
  },
});
