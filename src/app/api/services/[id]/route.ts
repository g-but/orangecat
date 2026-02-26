/**
 * Service CRUD API Routes
 *
 * Uses generic entity handler from lib/api/entityCrudHandler.ts
 * Entity metadata comes from entity-registry (Single Source of Truth)
 *
 * Before refactoring: 189 lines
 * After refactoring: ~45 lines (76% reduction)
 */

import { userServiceSchema } from '@/lib/validation';
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import {
  createUpdatePayloadBuilder,
  commonFieldMappings,
  entityTransforms,
} from '@/lib/api/buildUpdatePayload';

// Build update payload from validated service data
const buildServiceUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'description', transform: entityTransforms.emptyStringToNull },
  { from: 'category' },
  { from: 'hourly_rate' },
  { from: 'fixed_price' },
  // Currency: only include if explicitly provided (don't override existing value)
  // Currency is for display/input only - all transactions are in BTC
  { from: 'currency' },
  { from: 'duration_minutes' },
  { from: 'availability_schedule' },
  { from: 'service_location_type', default: 'remote' },
  { from: 'service_area', transform: entityTransforms.emptyStringToNull },
  commonFieldMappings.arrayField('images', []),
  commonFieldMappings.arrayField('portfolio_links', []),
  { from: 'status', default: 'draft' }, // Ensure status is preserved
]);

// Create handlers using generic factory
const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'service',
  schema: userServiceSchema,
  buildUpdatePayload: buildServiceUpdatePayload,
  ownershipField: 'actor_id',
  useActorOwnership: true,
});

export { GET, PUT, DELETE };
