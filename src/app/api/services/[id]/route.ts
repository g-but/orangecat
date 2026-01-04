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
import { createUpdatePayloadBuilder } from '@/lib/api/buildUpdatePayload';

// Build update payload from validated service data
const buildServiceUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'description' },
  { from: 'category' },
  { from: 'hourly_rate_sats' },
  { from: 'fixed_price_sats' },
  { from: 'currency', default: 'CHF' }, // Platform default - user can override in form
  { from: 'duration_minutes' },
  { from: 'availability_schedule' },
  { from: 'service_location_type', default: 'remote' },
  { from: 'service_area' },
  { from: 'images', default: [] },
  { from: 'portfolio_links', default: [] },
]);

// Create handlers using generic factory
const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'service',
  schema: userServiceSchema,
  buildUpdatePayload: buildServiceUpdatePayload,
});

export { GET, PUT, DELETE };
