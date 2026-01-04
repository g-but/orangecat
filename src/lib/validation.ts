import { z } from 'zod';
import DOMPurify from 'dompurify';
import { validatePhoneNumber, normalizePhoneNumber } from './phone-validation';
import { CURRENCY_CODES, DEFAULT_CURRENCY } from '@/config/currencies';

// Profile validation
// Note: Server-side normalizes empty strings to undefined before validation
// Username is optional (can be set during registration/profile update)
export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ), // Required field - no optional/nullable
  name: z.string().max(100).optional().nullable().or(z.literal('')),
  bio: z.string().max(500).optional().nullable().or(z.literal('')),
  // Structured location fields for better search functionality
  location_country: z
    .string()
    .max(2)
    .optional()
    .nullable()
    .refine(val => !val || val.length === 2, {
      message: 'Country code must be 2 characters (ISO 3166-1 alpha-2)',
    })
    .or(z.literal('')),
  location_city: z.string().max(100).optional().nullable().or(z.literal('')),
  location_zip: z.string().max(20).optional().nullable().or(z.literal('')),
  location_search: z.string().optional().nullable().or(z.literal('')),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  // Extended transparency fields
  background: z.string().max(1000).optional().nullable().or(z.literal('')),
  inspiration_statement: z.string().max(500).optional().nullable().or(z.literal('')),
  location_context: z.string().max(300).optional().nullable().or(z.literal('')),
  // Legacy location field (deprecated but kept for backward compatibility)
  location: z.string().max(100).optional().nullable().or(z.literal('')),
  avatar_url: z.string().url().optional().nullable().or(z.literal('')),
  banner_url: z.string().url().optional().nullable().or(z.literal('')),
  website: z
    .string()
    .max(200)
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine(
      val =>
        !val ||
        val.trim() === '' ||
        /^https?:\/\/.+/i.test(val) ||
        /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(val),
      'Please enter a valid website (e.g., orangecat.ch or https://orangecat.ch)'
    ),
  // Social & Contact
  social_links: z
    .object({
      links: z.array(
        z.object({
          platform: z.string(),
          label: z.string().optional().nullable(),
          value: z.string().min(1, 'Value is required'),
        })
      ),
    })
    .optional()
    .nullable(),
  contact_email: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine(
      val => !val || val.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'Please enter a valid email address'
    ),
  phone: z
    .string()
    .max(20)
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine(
      val => {
        if (!val || val.trim() === '') {
          return true;
        }
        const result = validatePhoneNumber(val);
        return result.valid;
      },
      val => {
        const result = validatePhoneNumber(val || '');
        return result.error || 'Invalid phone number format';
      }
    ),
  // Wallet fields (kept for backward compatibility, but wallets are now managed separately)
  // IMPORTANT: Validation is intentionally lenient to avoid blocking profile saves
  // when legacy data contains non-standard test values.
  bitcoin_address: z.string().max(200).optional().nullable().or(z.literal('')),
  lightning_address: z.string().max(200).optional().nullable().or(z.literal('')),
});

// Project validation
export const projectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  goal_amount: z.number().int().positive().optional().nullable(),
  currency: z.enum(['CHF', 'USD', 'EUR', 'BTC', 'SATS']).optional().nullable().default('SATS'),
  funding_purpose: z.string().max(500).optional().nullable(),
  bitcoin_address: z
    .string()
    .refine(val => !val || /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,}$/.test(val), {
      message: 'Invalid Bitcoin address format',
    })
    .optional()
    .nullable()
    .or(z.literal('')),
  lightning_address: z.string().email().optional().nullable().or(z.literal('')),
  website_url: z.string().url().optional().nullable().or(z.literal('')),
  category: z.string().optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).optional().nullable().default([]),
  start_date: z.string().optional().nullable().or(z.literal('')),
  target_completion: z.string().optional().nullable().or(z.literal('')),
});

// Transaction validation (replaces donations)
export const transactionSchema = z.object({
  amount_sats: z.number().int().positive().max(1000000000000),
  from_entity_type: z.enum(['profile', 'project']),
  from_entity_id: z.string().uuid(),
  to_entity_type: z.enum(['profile', 'project']),
  to_entity_id: z.string().uuid(),
  payment_method: z.enum(['bitcoin', 'lightning', 'on-chain', 'off-chain']),
  message: z.string().max(500).optional().nullable(),
  purpose: z.string().optional().nullable(),
  anonymous: z.boolean().default(false),
  public_visibility: z.boolean().default(true),
});

// REMOVED: Organization validation (not in MVP)

// HTML sanitization for rich text content
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: basic HTML tag removal for security
    return html.replace(/<[^>]*>/g, '');
  }

  // Client-side: use DOMPurify for comprehensive sanitization
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  });
}

// Helper function to normalize profile data
export function normalizeProfileData(data: unknown): ProfileData {
  const normalized = { ...data };

  // If name is empty or not provided, use username
  if (!normalized.name || normalized.name.trim() === '') {
    normalized.name = normalized.username;
  }

  // Auto-add https:// to website if protocol is missing
  if (normalized.website && typeof normalized.website === 'string') {
    const website = normalized.website.trim();
    if (website && !website.match(/^https?:\/\//i)) {
      // Only add https:// if it looks like a domain (has a dot)
      if (website.includes('.')) {
        normalized.website = `https://${website}`;
      }
    }
  }

  // Normalize phone number to E.164 format
  if (normalized.phone && typeof normalized.phone === 'string') {
    const normalizedPhone = normalizePhoneNumber(normalized.phone);
    if (normalizedPhone) {
      normalized.phone = normalizedPhone;
    }
  }

  // Normalize country code to uppercase if provided
  if (normalized.location_country && typeof normalized.location_country === 'string') {
    normalized.location_country = normalized.location_country.trim().toUpperCase();
  }

  // Trim and clean location fields
  if (normalized.location_city && typeof normalized.location_city === 'string') {
    normalized.location_city = normalized.location_city.trim();
  }

  if (normalized.location_zip && typeof normalized.location_zip === 'string') {
    normalized.location_zip = normalized.location_zip.trim();
  }

  // Normalize contact_email:
  // - If user explicitly provides a public contact email, store it in the
  //   profile.email column which is used as the public-facing email.
  // - If contact_email is empty, keep existing email unchanged.
  if (normalized.contact_email && typeof normalized.contact_email === 'string') {
    normalized.email = normalized.contact_email;
  }

  // Normalize social_links: ensure structure is { links: [...] }
  if (normalized.social_links) {
    if (Array.isArray(normalized.social_links)) {
      // If it's an array, wrap it
      normalized.social_links = { links: normalized.social_links };
    } else if (normalized.social_links && !normalized.social_links.links) {
      // If it's an object but not the right structure, try to convert
      normalized.social_links = { links: [] };
    }
    // Filter out empty links
    if (normalized.social_links.links) {
      normalized.social_links.links = normalized.social_links.links.filter(
        (link: { value?: string }) => link && link.value && link.value.trim()
      );
      // If no links, set to undefined
      if (normalized.social_links.links.length === 0) {
        normalized.social_links = undefined;
      }
    }
  }

  // Normalize empty strings to undefined for optional fields
  Object.keys(normalized).forEach(key => {
    if (typeof normalized[key] === 'string' && normalized[key].trim() === '') {
      normalized[key] = undefined;
    }
  });

  return normalized;
}

// Personal Economy validation schemas
export const userProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().max(1000).optional().nullable().or(z.literal('')),
  price_sats: z.number().positive('Price must be positive'),
  currency: z.enum(['SATS', 'BTC']).default('SATS'),
  product_type: z.enum(['physical', 'digital', 'service']).default('physical'),
  images: z.array(z.string().url()).optional().default([]),
  thumbnail_url: z.string().url().optional().nullable().or(z.literal('')),
  inventory_count: z.number().int().min(-1).default(-1), // -1 = unlimited
  fulfillment_type: z.enum(['manual', 'automatic', 'digital']).default('manual'),
  category: z.string().max(50).optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'active', 'paused', 'sold_out']).default('draft'),
  is_featured: z.boolean().default(false),
});

export const userCircleSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be under 50 characters'),
  description: z.string().max(500, 'Description must be under 500 characters').optional().nullable(),
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

export const userServiceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().max(1000).optional().nullable().or(z.literal('')),
  category: z.string().min(1, 'Category is required').max(50),
  hourly_rate_sats: z.number().positive().optional().nullable(),
  fixed_price_sats: z.number().positive().optional().nullable(),
  currency: z.enum(['SATS', 'BTC']).default('SATS'),
  duration_minutes: z.number().positive().optional().nullable(),
  availability_schedule: z.any().optional(), // JSON object for complex scheduling
  service_location_type: z.enum(['remote', 'onsite', 'both']).default('remote'),
  service_area: z.string().max(200).optional().nullable().or(z.literal('')),
  images: z.array(z.string().url()).optional().default([]),
  portfolio_links: z.array(z.string().url()).optional().default([]),
  status: z.enum(['draft', 'active', 'paused', 'unavailable']).default('draft'),
}).refine(
  data => data.hourly_rate_sats || data.fixed_price_sats,
  {
    message: "At least one pricing method (hourly or fixed) is required",
    path: ["hourly_rate_sats"], // This will show the error on hourly_rate_sats field
  }
);

export const userCauseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().max(1000).optional().nullable().or(z.literal('')),
  cause_category: z.string().min(1, 'Category is required').max(50),
  goal_sats: z.number().positive().optional().nullable(),
  currency: z.enum(['SATS', 'BTC']).default('SATS'),
  bitcoin_address: z.string().optional().nullable().or(z.literal('')),
  lightning_address: z.string().optional().nullable().or(z.literal('')),
  distribution_rules: z.any().optional(), // JSON object for distribution rules
  beneficiaries: z.array(z.any()).optional().default([]), // Array of beneficiary objects
  status: z.enum(['draft', 'active', 'completed', 'paused']).default('draft'),
});

/**
 * AI Assistant Schema
 *
 * Comprehensive schema for AI assistants that creators build and monetize.
 * Supports multiple compute providers (API, self-hosted, community)
 * and flexible pricing models (per-message, per-token, subscription).
 */
export const aiAssistantSchema = z.object({
  // Basic Info
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().max(1000).optional().nullable().or(z.literal('')),
  category: z.string().max(50).optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).optional().default([]),
  avatar_url: z.string().url().optional().nullable().or(z.literal('')),

  // AI Configuration (the "software")
  system_prompt: z.string().min(10, 'System prompt must be at least 10 characters').max(10000, 'System prompt must be at most 10000 characters'),
  welcome_message: z.string().max(500).optional().nullable().or(z.literal('')),
  personality_traits: z.array(z.string()).optional().default([]),
  knowledge_base_urls: z.array(z.string().url()).optional().default([]),

  // Model Preferences
  model_preference: z.string().max(50).default('any'),
  max_tokens_per_response: z.number().int().positive().max(32000).default(1000),
  temperature: z.number().min(0).max(2).default(0.7),

  // Compute Configuration
  compute_provider_type: z.enum(['api', 'self_hosted', 'community']).default('api'),
  compute_provider_id: z.string().uuid().optional().nullable(),
  api_provider: z.string().max(50).optional().nullable().or(z.literal('')),

  // Pricing
  pricing_model: z.enum(['per_message', 'per_token', 'subscription', 'free']).default('per_message'),
  price_per_message_sats: z.number().int().min(0).default(0),
  price_per_1k_tokens_sats: z.number().int().min(0).default(0),
  subscription_price_sats: z.number().int().min(0).default(0),
  free_messages_per_day: z.number().int().min(0).default(0),

  // Visibility & Status
  status: z.enum(['draft', 'active', 'paused', 'archived']).default('draft'),
  is_public: z.boolean().default(false),
  is_featured: z.boolean().default(false),

  // Bitcoin Payment Info
  lightning_address: z.string().optional().nullable().or(z.literal('')),
  bitcoin_address: z.string().optional().nullable().or(z.literal('')),
});

// Legacy schema alias for backward compatibility
export const userAIAssistantSchema = aiAssistantSchema;

// Organization validation
export const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Name must be at most 255 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9][a-z0-9\-]*[a-z0-9]$/, 'Slug must start and end with alphanumeric characters and can contain hyphens'),
  type: z.enum(['dao', 'company', 'nonprofit', 'community', 'cooperative', 'foundation', 'collective', 'guild', 'syndicate', 'circle']),
  description: z.string().max(5000).optional().nullable().or(z.literal('')),
  category: z.string().max(100).optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).default([]).optional(),
  website_url: z.string().url().optional().nullable().or(z.literal('')).refine(
    val => !val || val.trim() === '' || /^https?:\/\/.+/i.test(val),
    'Please enter a valid URL (e.g., https://example.com)'
  ),
  governance_model: z.enum(['hierarchical', 'flat', 'democratic', 'consensus', 'liquid_democracy', 'quadratic_voting', 'stake_weighted', 'reputation_based']).default('hierarchical'),
  treasury_address: z.string().max(255).optional().nullable().or(z.literal('')),
  lightning_address: z.string().max(255).optional().nullable().or(z.literal('')),
  avatar_url: z.string().url().optional().nullable().or(z.literal('')),
  banner_url: z.string().url().optional().nullable().or(z.literal('')),
  is_public: z.boolean().default(true),
  requires_approval: z.boolean().default(true),
});

// Asset validation
export const assetSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be at most 100 characters'),
  type: z.enum(['real_estate', 'business', 'vehicle', 'equipment', 'securities', 'other']),
  description: z.string().max(2000).optional().nullable().or(z.literal('')),
  location: z.string().max(200).optional().nullable().or(z.literal('')),
  estimated_value: z.number().positive().optional().nullable(),
  currency: z.enum(CURRENCY_CODES).default(DEFAULT_CURRENCY),
  documents: z.array(z.string().url()).optional().nullable().default([]),
});

// Loan validation
export const loanSchema = z.object({
  // Loan type: new_request (seeking new loan) or existing_refinance (refinancing existing)
  loan_type: z.enum(['new_request', 'existing_refinance']).default('new_request'),

  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be at most 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be at most 1000 characters'),
  loan_category_id: z.string().optional().nullable().or(z.literal('')),
  original_amount: z.number().positive('Amount must be greater than 0'),
  remaining_balance: z.number().positive('Balance must be greater than 0'),
  interest_rate: z.number().min(0).max(100).optional().nullable(),
  bitcoin_address: z.string().optional().nullable().or(z.literal('')),
  lightning_address: z.string().optional().nullable().or(z.literal('')),
  fulfillment_type: z.enum(['manual', 'automatic']).default('manual'),
  currency: z.string().optional().default('CHF'),

  // Fields specific to existing loans (refinancing)
  current_lender: z.string().max(100).optional().nullable().or(z.literal('')),
  current_interest_rate: z.number().min(0).max(100).optional().nullable(),
  monthly_payment: z.number().min(0).optional().nullable(),
  desired_rate: z.number().min(0).max(100).optional().nullable(),
  
  // Collateral (array of collateral items)
  collateral: z.array(z.any()).optional().default([]),
});

// Event validation
export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be at most 100 characters'),
  description: z.string().max(2000).optional().nullable().or(z.literal('')),
  category: z.string().max(50).optional().nullable().or(z.literal('')),
  event_type: z.enum(['meetup', 'conference', 'workshop', 'party', 'exhibition', 'festival', 'retreat', 'other']).default('meetup'),
  tags: z.array(z.string()).optional().default([]),
  
  // Date & Time
  start_date: z.string().or(z.date()).refine(
    (val) => {
      const date = typeof val === 'string' ? new Date(val) : val;
      return !isNaN(date.getTime());
    },
    'Start date is required and must be valid'
  ),
  end_date: z.string().or(z.date()).optional().nullable().refine(
    (val) => {
      if (!val) return true;
      const date = typeof val === 'string' ? new Date(val) : val;
      return !isNaN(date.getTime());
    },
    'End date must be valid'
  ),
  timezone: z.string().default('UTC'),
  is_all_day: z.boolean().default(false),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.any().optional(), // JSON object for recurrence
  
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
  rsvp_deadline: z.string().or(z.date()).optional().nullable().refine(
    (val) => {
      if (!val) return true;
      const date = typeof val === 'string' ? new Date(val) : val;
      return !isNaN(date.getTime());
    },
    'RSVP deadline must be valid'
  ),
  
  // Pricing & Funding
  ticket_price_sats: z.number().positive().optional().nullable(),
  currency: z.enum(['SATS', 'BTC']).default('SATS'),
  is_free: z.boolean().default(false),
  funding_goal_sats: z.number().positive().optional().nullable(),
  bitcoin_address: z.string().optional().nullable().or(z.literal('')),
  lightning_address: z.string().optional().nullable().or(z.literal('')),
  
  // Media
  images: z.array(z.string().url()).optional().default([]),
  thumbnail_url: z.string().url().optional().nullable().or(z.literal('')),
  banner_url: z.string().url().optional().nullable().or(z.literal('')),
  video_url: z.string().url().optional().nullable().or(z.literal('')),
  
  // Status
  status: z.enum(['draft', 'published', 'open', 'full', 'ongoing', 'completed', 'cancelled']).default('draft'),
}).refine(
  (data) => {
    // If not free, either ticket_price_sats or funding_goal_sats must be set
    if (!data.is_free && !data.ticket_price_sats && !data.funding_goal_sats) {
      return false;
    }
    return true;
  },
  {
    message: 'Either ticket price or funding goal must be set for paid events',
    path: ['ticket_price_sats'],
  }
).refine(
  (data) => {
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

export type ProfileData = z.infer<typeof profileSchema>;
export type ProjectData = z.infer<typeof projectSchema>;
export type TransactionData = z.infer<typeof transactionSchema>;
export type UserProductFormData = z.infer<typeof userProductSchema>;
export type UserServiceFormData = z.infer<typeof userServiceSchema>;
export type UserCircleFormData = z.infer<typeof userCircleSchema>;
export type UserCauseFormData = z.infer<typeof userCauseSchema>;
export type AIAssistantFormData = z.infer<typeof aiAssistantSchema>;
export type UserAIAssistantFormData = AIAssistantFormData; // Legacy alias
export type OrganizationFormData = z.infer<typeof organizationSchema>;
export type AssetFormData = z.infer<typeof assetSchema>;
export type LoanFormData = z.infer<typeof loanSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
