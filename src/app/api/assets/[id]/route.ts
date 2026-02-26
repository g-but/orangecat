/**
 * Asset CRUD API Routes
 *
 * Uses generic entity handler from lib/api/entityCrudHandler.ts
 * Entity metadata comes from entity-registry (Single Source of Truth)
 *
 * Note: Assets use actor_id for ownership via useActorOwnership pattern
 *
 * Before refactoring: 214 lines
 * After refactoring: ~45 lines (79% reduction)
 */

import { assetSchema } from '@/lib/validation';
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import {
  createUpdatePayloadBuilder,
  commonFieldMappings,
  entityTransforms,
} from '@/lib/api/buildUpdatePayload';

// Build update payload from validated asset data
const buildAssetUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'type' },
  { from: 'description', transform: entityTransforms.emptyStringToNull },
  { from: 'location', transform: entityTransforms.emptyStringToNull },
  { from: 'estimated_value' },
  // Currency: only include if explicitly provided (don't override existing value)
  // Currency is for display/input only - all transactions are in BTC
  { from: 'currency' },
  commonFieldMappings.arrayField('documents', []), // Normalize null to empty array
]);

// Create handlers using generic factory
const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'asset',
  schema: assetSchema,
  buildUpdatePayload: buildAssetUpdatePayload,
  ownershipField: 'actor_id',
  useActorOwnership: true,
  requireAuthForGet: true, // Assets require auth to view
  requireActiveStatus: false, // Assets don't filter by status='active'
});

export { GET, PUT, DELETE };
