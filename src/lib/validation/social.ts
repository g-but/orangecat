import { z } from 'zod';
import { CURRENCY_CODES } from '@/config/currencies';
import { lightningAddressSchema } from './base';

export const userCircleSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be under 50 characters'),
  description: z
    .string()
    .max(500, 'Description must be under 500 characters')
    .optional()
    .nullable(),
  category: z.string().min(1, 'Please select a category'),

  // Enhanced visibility and membership
  visibility: z.enum(['public', 'private', 'hidden']).default('private'),
  max_members: z.number().int().positive().optional().nullable(),
  member_approval: z.enum(['auto', 'manual', 'invite']).default('manual'),

  // Geographic features
  location_restricted: z.boolean().default(false),
  location_radius_km: z.number().int().positive().optional().nullable(),

  // Economic features
  bitcoin_address: z.string().optional().nullable(),
  wallet_purpose: z.string().max(200).optional().nullable(),
  contribution_required: z.boolean().default(false),
  contribution_amount: z.number().positive().optional().nullable(),

  // Activity settings
  activity_level: z.enum(['casual', 'regular', 'intensive']).default('regular'),
  meeting_frequency: z.enum(['none', 'weekly', 'monthly', 'quarterly']).default('none'),

  // Advanced features
  enable_projects: z.boolean().default(false),
  enable_events: z.boolean().default(true),
  enable_discussions: z.boolean().default(true),
  require_member_intro: z.boolean().default(false),
});

// Organization validation
export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .max(255, 'Name must be at most 255 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be at most 100 characters')
    .regex(
      /^[a-z0-9][a-z0-9\-]*[a-z0-9]$/,
      'Slug must start and end with alphanumeric characters and can contain hyphens'
    ),
  type: z.enum([
    'dao',
    'company',
    'nonprofit',
    'community',
    'cooperative',
    'foundation',
    'collective',
    'guild',
    'syndicate',
    'circle',
  ]),
  description: z.string().max(5000).optional().nullable().or(z.literal('')),
  category: z.string().max(100).optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).default([]).optional(),
  website_url: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine(
      val => !val || val.trim() === '' || /^https?:\/\/.+/i.test(val),
      'Please enter a valid URL (e.g., https://example.com)'
    ),
  governance_model: z
    .enum([
      'hierarchical',
      'flat',
      'democratic',
      'consensus',
      'liquid_democracy',
      'quadratic_voting',
      'stake_weighted',
      'reputation_based',
    ])
    .default('hierarchical'),
  treasury_address: z.string().max(255).optional().nullable().or(z.literal('')),
  lightning_address: lightningAddressSchema,
  avatar_url: z.string().url().optional().nullable().or(z.literal('')),
  banner_url: z.string().url().optional().nullable().or(z.literal('')),
  is_public: z.boolean().default(true),
  requires_approval: z.boolean().default(true),
});

/**
 * Recurrence pattern for events.
 * Standard iCalendar-style recurrence rule stored as JSONB in the database.
 *
 * Uses .passthrough() to allow additional fields without breaking existing data.
 */
export const recurrencePatternSchema = z
  .object({
    frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']).optional(),
    interval: z.number().int().positive().max(365).optional(),
    end_date: z.string().optional().nullable(),
    count: z.number().int().positive().max(1000).optional().nullable(),
    days_of_week: z
      .array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']))
      .optional(),
    day_of_month: z.number().int().min(1).max(31).optional().nullable(),
    month_of_year: z.number().int().min(1).max(12).optional().nullable(),
  })
  .passthrough();

// Event validation
export const eventSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be at most 100 characters'),
    description: z.string().max(2000).optional().nullable().or(z.literal('')),
    category: z.string().max(50).optional().nullable().or(z.literal('')),
    event_type: z
      .enum([
        'meetup',
        'conference',
        'workshop',
        'party',
        'exhibition',
        'festival',
        'retreat',
        'other',
      ])
      .default('meetup'),
    tags: z.array(z.string()).optional().default([]),

    // Date & Time
    start_date: z
      .string()
      .or(z.date())
      .refine(val => {
        const date = typeof val === 'string' ? new Date(val) : val;
        return !isNaN(date.getTime());
      }, 'Start date is required and must be valid'),
    end_date: z
      .string()
      .or(z.date())
      .optional()
      .nullable()
      .refine(val => {
        if (!val) {
          return true;
        }
        const date = typeof val === 'string' ? new Date(val) : val;
        return !isNaN(date.getTime());
      }, 'End date must be valid'),
    timezone: z.string().default('UTC'),
    is_all_day: z.boolean().default(false),
    is_recurring: z.boolean().default(false),
    recurrence_pattern: recurrencePatternSchema.optional().nullable(),

    // Location
    venue_name: z.string().max(200).optional().nullable().or(z.literal('')),
    venue_address: z.string().max(500).optional().nullable().or(z.literal('')),
    venue_city: z.string().max(100).optional().nullable().or(z.literal('')),
    venue_country: z.string().max(100).optional().nullable().or(z.literal('')),
    venue_postal_code: z.string().max(20).optional().nullable().or(z.literal('')),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    is_online: z.boolean().default(false),
    online_url: z.string().url().optional().nullable().or(z.literal('')),
    asset_id: z.string().uuid().optional().nullable().or(z.literal('')),

    // Capacity & Attendance
    max_attendees: z.number().int().positive().optional().nullable(),
    requires_rsvp: z.boolean().default(true),
    rsvp_deadline: z
      .string()
      .or(z.date())
      .optional()
      .nullable()
      .refine(val => {
        if (!val) {
          return true;
        }
        const date = typeof val === 'string' ? new Date(val) : val;
        return !isNaN(date.getTime());
      }, 'RSVP deadline must be valid'),

    // Pricing & Funding
    // Amounts stored in user's currency (not satoshis)
    ticket_price: z.number().positive().optional().nullable(),
    currency: z.enum(CURRENCY_CODES).optional(),
    is_free: z.boolean().default(false),
    funding_goal: z.number().positive().optional().nullable(),
    bitcoin_address: z.string().optional().nullable().or(z.literal('')),
    lightning_address: lightningAddressSchema,

    // Media
    images: z.array(z.string().url()).optional().default([]),
    thumbnail_url: z.string().url().optional().nullable().or(z.literal('')),
    banner_url: z.string().url().optional().nullable().or(z.literal('')),
    video_url: z.string().url().optional().nullable().or(z.literal('')),

    // Status
    status: z
      .enum(['draft', 'published', 'open', 'full', 'ongoing', 'completed', 'cancelled'])
      .default('draft'),
  })
  .refine(
    data => {
      // If not free, either ticket_price or funding_goal must be set
      if (!data.is_free && !data.ticket_price && !data.funding_goal) {
        return false;
      }
      return true;
    },
    {
      message: 'Either ticket price or funding goal must be set for paid events',
      path: ['ticket_price'],
    }
  )
  .refine(
    data => {
      // If online, online_url should be provided
      if (data.is_online && !data.online_url) {
        return false;
      }
      return true;
    },
    {
      message: 'Online URL is required for online events',
      path: ['online_url'],
    }
  );

// Types
export type UserCircleFormData = z.infer<typeof userCircleSchema>;
export type OrganizationFormData = z.infer<typeof organizationSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type RecurrencePatternData = z.infer<typeof recurrencePatternSchema>;
