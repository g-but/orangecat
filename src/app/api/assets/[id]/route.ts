/**
 * Asset CRUD API Routes
 *
 * Uses generic entity handler from lib/api/entityCrudHandler.ts
 * Entity metadata comes from entity-registry (Single Source of Truth)
 *
 * Note: Assets use 'owner_id' instead of 'user_id' for ownership
 * and table name 'assets' instead of 'user_assets'
 *
 * Before refactoring: 214 lines
 * After refactoring: ~45 lines (79% reduction)
 */

import { assetSchema } from '@/lib/validation';
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import { createUpdatePayloadBuilder } from '@/lib/api/buildUpdatePayload';

// Build update payload from validated asset data
const buildAssetUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'type' },
  { from: 'description' },
  { from: 'location' },
  { from: 'estimated_value' },
  { from: 'currency' },
  { from: 'documents', default: null },
]);

// Create handlers using generic factory
const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'asset',
  schema: assetSchema,
  buildUpdatePayload: buildAssetUpdatePayload,
  ownershipField: 'owner_id', // Assets use owner_id instead of user_id
  tableName: 'assets', // Override registry's 'user_assets' with actual table name
  requireAuthForGet: true, // Assets require auth to view
  requireActiveStatus: false, // Assets don't filter by status='active'
});

export { GET, PUT, DELETE };
