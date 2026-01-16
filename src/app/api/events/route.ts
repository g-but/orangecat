/**
 * Events API Routes
 *
 * Uses generic entity handlers for maximum modularity and DRY principles.
 * Entity metadata comes from entity-registry (Single Source of Truth)
 *
 * Created: 2025-01-28
 * Last Modified: 2026-01-05
 * Last Modified Summary: Updated to use user's preferred currency from profile (SSOT)
 */

import { eventSchema } from '@/lib/validation';
import { createEntityListHandler } from '@/lib/api/entityListHandler';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';
import { normalizeDates } from '@/lib/api/helpers';
import { CURRENCY_CODES, PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { COLUMNS } from '@/config/database-columns';
import { DATABASE_TABLES } from '@/config/database-tables';

// Event status values
const EVENT_PUBLIC_STATUSES = ['published', 'open', 'full', 'ongoing', 'completed'] as const;
const EVENT_DRAFT_STATUSES = ['draft', 'cancelled', ...EVENT_PUBLIC_STATUSES] as const;

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
  transformData: async (data, userId, supabase) => {
    // Get user's preferred currency from profile (SSOT)
    let userCurrency = PLATFORM_DEFAULT_CURRENCY;
    const { data: profile } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(DATABASE_TABLES.PROFILES) as any)
      .select(COLUMNS.profiles.CURRENCY)
      .eq(COLUMNS.profiles.ID, userId)
      .single();

    if (profile?.currency && CURRENCY_CODES.includes(profile.currency as typeof CURRENCY_CODES[number])) {
      userCurrency = profile.currency as typeof CURRENCY_CODES[number];
    }
    
    // Normalize dates first
    const normalized = normalizeDates(data, [...EVENT_DATE_FIELDS]);
    
    // Normalize empty strings to null for optional fields
    const cleaned: Record<string, unknown> = {
      ...normalized,
      user_id: userId,
    };
    
    // Fields that should be null if empty string
    const optionalStringFields = [
      'description', 'category', 'venue_name', 'venue_address', 'venue_city',
      'venue_country', 'venue_postal_code', 'online_url', 'bitcoin_address',
      'lightning_address', 'thumbnail_url', 'banner_url', 'video_url', 'asset_id'
    ];
    
    for (const field of optionalStringFields) {
      if (field in cleaned && cleaned[field] === '') {
        cleaned[field] = null;
      }
    }
    
    // Set currency: use provided value, or user's preference, or platform default
    // Currency is ONLY for display/input - all transactions are in BTC
    if (!cleaned.currency || cleaned.currency === '') {
      cleaned.currency = userCurrency;
    }
    
    // Validate currency is in allowed list (should be validated by schema, but double-check)
    // This prevents database constraint violations
    if (cleaned.currency && !CURRENCY_CODES.includes(cleaned.currency as typeof CURRENCY_CODES[number])) {
      throw new Error(`Invalid currency: ${cleaned.currency}. Must be one of: ${CURRENCY_CODES.join(', ')}`);
    }

    // Map schema field names to database column names
    // Schema uses: ticket_price, funding_goal
    // Database uses: ticket_price_sats, funding_goal_sats
    if ('ticket_price' in cleaned) {
      cleaned.ticket_price_sats = cleaned.ticket_price;
      delete cleaned.ticket_price;
    }
    if ('funding_goal' in cleaned) {
      cleaned.funding_goal_sats = cleaned.funding_goal;
      delete cleaned.funding_goal;
    }

    return cleaned;
  },
  defaultFields: {
    current_attendees: 0,
  },
});

