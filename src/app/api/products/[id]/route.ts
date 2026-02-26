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
import {
  createUpdatePayloadBuilder,
  commonFieldMappings,
  entityTransforms,
} from '@/lib/api/buildUpdatePayload';

// Build update payload from validated product data
const buildProductUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'description', transform: entityTransforms.emptyStringToNull },
  { from: 'price' },
  // Currency: only include if explicitly provided (don't override existing value)
  // Currency is for display/input only - all transactions are in BTC
  { from: 'currency' },
  { from: 'product_type', default: 'physical' },
  commonFieldMappings.arrayField('images', []),
  commonFieldMappings.urlField('thumbnail_url'),
  { from: 'inventory_count', default: -1 },
  { from: 'fulfillment_type', default: 'manual' },
  { from: 'category', transform: entityTransforms.emptyStringToNull },
  commonFieldMappings.arrayField('tags', []),
  { from: 'status', default: 'draft' }, // Ensure status is preserved
  { from: 'is_featured', default: false },
]);

// Create handlers using generic factory
const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'product',
  schema: userProductSchema,
  buildUpdatePayload: buildProductUpdatePayload,
  ownershipField: 'actor_id',
  useActorOwnership: true,
});

export { GET, PUT, DELETE };
