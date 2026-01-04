/**
 * Product CRUD API Routes
 *
 * Uses generic entity handler from lib/api/entityCrudHandler.ts
 * Entity metadata comes from entity-registry (Single Source of Truth)
 *
 * Before refactoring: 189 lines
 * After refactoring: ~45 lines (76% reduction)
 */

import { userProductSchema } from '@/lib/validation';
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import { createUpdatePayloadBuilder } from '@/lib/api/buildUpdatePayload';

// Build update payload from validated product data
const buildProductUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'description' },
  { from: 'price_sats' },
  { from: 'currency', default: 'CHF' }, // Platform default - user can override in form
  { from: 'product_type', default: 'physical' },
  { from: 'images', default: [] },
  { from: 'thumbnail_url' },
  { from: 'inventory_count', default: -1 },
  { from: 'fulfillment_type', default: 'manual' },
  { from: 'category' },
  { from: 'tags', default: [] },
  { from: 'is_featured', default: false },
]);

// Create handlers using generic factory
const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'product',
  schema: userProductSchema,
  buildUpdatePayload: buildProductUpdatePayload,
});

export { GET, PUT, DELETE };
