/**
 * Event CRUD API Routes
 *
 * Uses generic entity handler from lib/api/entityCrudHandler.ts
 * Entity metadata comes from entity-registry (Single Source of Truth)
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Initial creation using generic CRUD handler pattern
 */

import { eventSchema } from '@/lib/validation';
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import { createUpdatePayloadBuilder } from '@/lib/api/buildUpdatePayload';

// Build update payload from validated event data
const buildEventUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'description' },
  { from: 'category' },
  { from: 'event_type' },
  { from: 'tags', default: [] },
  { from: 'start_date' },
  { from: 'end_date' },
  { from: 'timezone', default: 'UTC' },
  { from: 'is_all_day', default: false },
  { from: 'is_recurring', default: false },
  { from: 'recurrence_pattern' },
  { from: 'venue_name' },
  { from: 'venue_address' },
  { from: 'venue_city' },
  { from: 'venue_country' },
  { from: 'venue_postal_code' },
  { from: 'latitude' },
  { from: 'longitude' },
  { from: 'is_online', default: false },
  { from: 'online_url' },
  { from: 'asset_id' },
  { from: 'max_attendees' },
  { from: 'requires_rsvp', default: true },
  { from: 'rsvp_deadline' },
  { from: 'ticket_price_sats' },
  { from: 'currency', default: 'CHF' }, // Platform default - user can override in form
  { from: 'is_free', default: false },
  { from: 'funding_goal_sats' },
  { from: 'bitcoin_address' },
  { from: 'lightning_address' },
  { from: 'images', default: [] },
  { from: 'thumbnail_url' },
  { from: 'banner_url' },
  { from: 'video_url' },
  { from: 'status', default: 'draft' },
]);

// Create handlers using generic factory
const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'event',
  schema: eventSchema,
  buildUpdatePayload: buildEventUpdatePayload,
  requireActiveStatus: false, // Events have different status values
});

export { GET, PUT, DELETE };



