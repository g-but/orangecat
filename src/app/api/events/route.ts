/**
 * Events API Routes
 *
 * Uses generic entity handlers for maximum modularity and DRY principles.
 * Entity metadata comes from entity-registry (Single Source of Truth)
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Refactored to use generic list and POST handlers
 */

import { eventSchema } from '@/lib/validation';
import { createEntityListHandler } from '@/lib/api/entityListHandler';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';
import { normalizeDates } from '@/lib/api/helpers';

// Event status values
const EVENT_PUBLIC_STATUSES = ['published', 'open', 'full', 'ongoing', 'completed'] as const;
const EVENT_DRAFT_STATUSES = ['draft', ...EVENT_PUBLIC_STATUSES] as const;

// Date fields that need normalization
const EVENT_DATE_FIELDS = ['start_date', 'end_date', 'rsvp_deadline'] as const;

// GET /api/events - Get all published events
export const GET = createEntityListHandler({
  entityType: 'event',
  publicStatuses: [...EVENT_PUBLIC_STATUSES],
  draftStatuses: [...EVENT_DRAFT_STATUSES],
  orderBy: 'start_date',
  orderDirection: 'asc',
  additionalFilters: {
    event_type: 'event_type',
  },
});

// POST /api/events - Create new event
export const POST = createEntityPostHandler({
  entityType: 'event',
  schema: eventSchema,
  transformData: (data, userId) => ({
    ...normalizeDates(data, [...EVENT_DATE_FIELDS]),
    user_id: userId,
  }),
  defaultFields: {
    current_attendees: 0,
  },
});

