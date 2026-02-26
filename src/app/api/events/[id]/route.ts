/**
 * Event CRUD API Routes
 *
 * Uses generic entity handler from lib/api/entityCrudHandler.ts
 * Entity metadata comes from entity-registry (Single Source of Truth)
 *
 * Created: 2025-01-28
 * Last Modified: 2026-01-05
 * Last Modified Summary: Removed currency default to prevent overwriting existing values
 */

import { eventSchema } from '@/lib/validation';
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import {
  createUpdatePayloadBuilder,
  commonFieldMappings,
  entityTransforms,
} from '@/lib/api/buildUpdatePayload';

// Build update payload from validated event data
const buildEventUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'description', transform: entityTransforms.emptyStringToNull },
  { from: 'category', transform: entityTransforms.emptyStringToNull },
  { from: 'event_type' },
  commonFieldMappings.arrayField('tags', []),
  commonFieldMappings.dateField('start_date'),
  commonFieldMappings.dateField('end_date'),
  { from: 'timezone', default: 'UTC' },
  { from: 'is_all_day', default: false },
  { from: 'is_recurring', default: false },
  { from: 'recurrence_pattern' },
  { from: 'venue_name', transform: entityTransforms.emptyStringToNull },
  { from: 'venue_address', transform: entityTransforms.emptyStringToNull },
  { from: 'venue_city', transform: entityTransforms.emptyStringToNull },
  { from: 'venue_country', transform: entityTransforms.emptyStringToNull },
  { from: 'venue_postal_code', transform: entityTransforms.emptyStringToNull },
  { from: 'latitude' },
  { from: 'longitude' },
  { from: 'is_online', default: false },
  commonFieldMappings.urlField('online_url'),
  commonFieldMappings.uuidField('asset_id'),
  { from: 'max_attendees' },
  { from: 'requires_rsvp', default: true },
  commonFieldMappings.dateField('rsvp_deadline'),
  // Amounts stored in user's currency (not satoshis)
  { from: 'ticket_price' },
  // Currency: only include if explicitly provided (don't override existing value)
  { from: 'currency' },
  { from: 'is_free', default: false },
  { from: 'funding_goal' },
  { from: 'bitcoin_address', transform: entityTransforms.emptyStringToNull },
  { from: 'lightning_address', transform: entityTransforms.emptyStringToNull },
  commonFieldMappings.arrayField('images', []),
  commonFieldMappings.urlField('thumbnail_url'),
  commonFieldMappings.urlField('banner_url'),
  commonFieldMappings.urlField('video_url'),
  { from: 'status', default: 'draft' },
]);

// Create handlers using generic factory
const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'event',
  schema: eventSchema,
  buildUpdatePayload: buildEventUpdatePayload,
  ownershipField: 'actor_id',
  useActorOwnership: true,
  requireActiveStatus: false, // Events have different status values
});

export { GET, PUT, DELETE };
