import { z } from 'zod';
import DOMPurify from 'dompurify';
import { validatePhoneNumber, normalizePhoneNumber } from './phone-validation';
import { CURRENCY_CODES } from '@/config/currencies';

/**
 * Lightning Address Validation
 *
 * Lightning addresses follow the format: username@domain.tld
 * They are NOT emails but use a similar format for LNURL-pay.
 *
 * Valid examples:
 * - satoshi@walletofsatoshi.com
 * - user@getalby.com
 * - myname@ln.tips
 * - test_user@strike.me
 *
 * Rules:
 * - Username: alphanumeric, underscore, hyphen, dot (no leading/trailing dots)
 * - Domain: valid domain format with at least one dot
 * - Case-insensitive
 */
const LIGHTNING_ADDRESS_REGEX =
  /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

/**
 * Validates a Lightning address format
 * @param address - The Lightning address to validate
 * @returns true if valid, false otherwise
 */
export function isValidLightningAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  // Lightning addresses are case-insensitive
  return LIGHTNING_ADDRESS_REGEX.test(address.toLowerCase());
}

/**
 * Zod schema for Lightning address validation
 * Use this in any schema that accepts Lightning addresses
 */
export const lightningAddressSchema = z
  .string()
  .max(200, 'Lightning address is too long')
  .refine(
    val => !val || val.trim() === '' || isValidLightningAddress(val),
    'Please enter a valid Lightning address (format: username@domain.com)'
  )
  .optional()
  .nullable()
  .or(z.literal(''));

/**
 * Currency Precision Utilities
 *
 * CRITICAL: All monetary values should be stored as integers to avoid
 * floating-point precision errors.
 *
 * - Bitcoin: Store in satoshis (1 BTC = 100,000,000 sats)
 * - Fiat: Store in smallest unit (cents, centimes, etc.)
 *
 * This ensures accurate calculations without rounding errors.
 */

/**
 * Schema for satoshi amounts (Bitcoin's smallest unit)
 * Always stored as positive integers
 */
export const satoshiAmountSchema = z
  .number()
  .int('Amount must be a whole number of satoshis')
  .positive('Amount must be positive')
  .max(2100000000000000, 'Amount exceeds maximum Bitcoin supply');

/**
 * Optional satoshi amount schema
 */
export const optionalSatoshiAmountSchema = satoshiAmountSchema.optional().nullable();

/**
 * Schema for fiat amounts stored as cents (smallest unit)
 * Allows storage without precision loss
 */
export const centsAmountSchema = z
  .number()
  .int('Amount must be a whole number (cents)')
  .nonnegative('Amount cannot be negative');

/**
 * Generic price schema that can be in sats or cents depending on currency
 * Use with a currency field to determine interpretation
 */
export const priceSchema = z.number().positive('Price must be positive');

/**
 * Integer price schema for when you want to ensure no decimals
 * Use for sats or cents storage
 */
export const integerPriceSchema = z
  .number()
  .int('Price must be a whole number')
  .positive('Price must be positive');

/**
 * Helper to convert a decimal fiat amount to cents
 * @param amount - Amount in dollars/francs/etc.
 * @returns Amount in cents
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Helper to convert cents to decimal fiat amount
 * @param cents - Amount in cents
 * @returns Amount in dollars/francs/etc.
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Validate and normalize a price value for storage
 * Converts to integer representation based on currency
 *
 * @param amount - The raw price amount
 * @param currency - The currency code (SATS, USD, CHF, etc.)
 * @returns Integer representation for storage
 */
export function normalizePrice(amount: number, currency: string): number {
  const upperCurrency = currency.toUpperCase();

  if (upperCurrency === 'SATS' || upperCurrency === 'BTC') {
    // For Bitcoin, amount is already in sats (or convert from BTC)
    if (upperCurrency === 'BTC') {
      return Math.round(amount * 100000000); // Convert BTC to sats
    }
    return Math.round(amount); // Ensure integer
  }

  // For fiat currencies, convert to cents
  return Math.round(amount * 100);
}

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
        return { message: result.error || 'Invalid phone number format' };
      }
    ),
  // Wallet fields (kept for backward compatibility, but wallets are now managed separately)
  // IMPORTANT: Validation is intentionally lenient to avoid blocking profile saves
  // when legacy data contains non-standard test values.
  bitcoin_address: z.string().max(200).optional().nullable().or(z.literal('')),
  lightning_address: z.string().max(200).optional().nullable().or(z.literal('')),
  // Currency preference for displaying prices
  currency: z.enum(CURRENCY_CODES).optional().nullable(),
});

// Project validation
export const projectSchema = z.object({
  title: z
    .string()
    .min(1, 'Project title is required')
    .max(100, 'Project title must be 100 characters or less'),
  description: z
    .string()
    .min(1, 'Project description is required')
    .max(2000, 'Description must be 2000 characters or less'),
  goal_amount: z
    .number({
      required_error: 'Funding goal is required',
      invalid_type_error: 'Funding goal must be a number',
    })
    .int('Funding goal must be a whole number')
    .positive('Funding goal must be greater than 0')
    .optional()
    .nullable(),
  currency: z
    .enum(CURRENCY_CODES, {
      errorMap: () => ({ message: 'Please select a valid currency' }),
    })
    .optional()
    .nullable(),
  funding_purpose: z
    .string()
    .max(500, 'Funding purpose must be 500 characters or less')
    .optional()
    .nullable(),
  bitcoin_address: z
    .string()
    .refine(val => !val || /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,}$/.test(val), {
      message: 'Please enter a valid Bitcoin address (starts with bc1, 1, or 3)',
    })
    .optional()
    .nullable()
    .or(z.literal('')),
  lightning_address: lightningAddressSchema,
  website_url: z
    .string()
    .url('Please enter a valid website URL (e.g., https://example.com)')
    .optional()
    .nullable()
    .or(z.literal('')),
  category: z.string().optional().nullable().or(z.literal('')),
  tags: z
    .array(
      z
        .string()
        .min(3, 'Tags must be at least 3 characters')
        .max(20, 'Tags must be 20 characters or less')
    )
    .optional()
    .nullable()
    .default([]),
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
  const normalized = { ...(data as Record<string, unknown>) } as Record<string, unknown>;

  // If name is empty or not provided, use username
  if (!normalized.name || (typeof normalized.name === 'string' && normalized.name.trim() === '')) {
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
    } else if (typeof normalized.social_links === 'object' && normalized.social_links !== null) {
      const socialLinks = normalized.social_links as Record<string, unknown>;
      if (!socialLinks.links) {
        // If it's an object but not the right structure, try to convert
        normalized.social_links = { links: [] };
      }
    }
    // Filter out empty links
    if (typeof normalized.social_links === 'object' && normalized.social_links !== null) {
      const socialLinks = normalized.social_links as { links?: Array<{ value?: string }> };
      if (socialLinks.links) {
        socialLinks.links = socialLinks.links.filter(
          (link: { value?: string }) => link && link.value && link.value.trim()
        );
        // If no links, set to undefined
        if (socialLinks.links.length === 0) {
          normalized.social_links = undefined;
        }
      }
    }
  }

  // Normalize empty strings to undefined for optional fields
  Object.keys(normalized).forEach(key => {
    const value = normalized[key];
    if (typeof value === 'string' && value.trim() === '') {
      normalized[key] = undefined;
    }
  });

  return normalized as unknown as ProfileData;
}

// Personal Economy validation schemas
export const userProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().max(1000).optional().nullable().or(z.literal('')),
  // Price interpretation depends on currency:
  // - SATS: Integer value in satoshis (e.g., 100000 = 100,000 sats)
  // - Fiat: Decimal value in currency units (e.g., 9.99 = $9.99)
  // For best precision with fiat, consider storing in cents and converting for display
  price: z.number().positive('Price must be positive'),
  currency: z.enum(CURRENCY_CODES).optional(),
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

export const userServiceSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
    description: z.string().max(1000).optional().nullable().or(z.literal('')),
    category: z.string().min(1, 'Category is required').max(50),
    hourly_rate: z.number().positive().optional().nullable(),
    fixed_price: z.number().positive().optional().nullable(),
    currency: z.enum(CURRENCY_CODES).optional(),
    duration_minutes: z.number().positive().optional().nullable(),
    availability_schedule: z.any().optional(), // JSON object for complex scheduling
    service_location_type: z.enum(['remote', 'onsite', 'both']).default('remote'),
    service_area: z.string().max(200).optional().nullable().or(z.literal('')),
    images: z.array(z.string().url()).optional().default([]),
    portfolio_links: z.array(z.string().url()).optional().default([]),
    status: z.enum(['draft', 'active', 'paused', 'unavailable']).default('draft'),
  })
  .refine(data => data.hourly_rate || data.fixed_price, {
    message: 'At least one pricing method (hourly or fixed) is required',
    path: ['hourly_rate'], // This will show the error on hourly_rate field
  });

export const userCauseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().max(1000).optional().nullable().or(z.literal('')),
  cause_category: z.string().min(1, 'Category is required').max(50),
  goal_amount: z.number().positive().optional().nullable(),
  currency: z.enum(CURRENCY_CODES).optional(),
  bitcoin_address: z.string().optional().nullable().or(z.literal('')),
  lightning_address: lightningAddressSchema,
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
  system_prompt: z
    .string()
    .min(10, 'System prompt must be at least 10 characters')
    .max(10000, 'System prompt must be at most 10000 characters'),
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
  pricing_model: z
    .enum(['per_message', 'per_token', 'subscription', 'free'])
    .default('per_message'),
  price_per_message: z.number().min(0).default(0),
  price_per_1k_tokens: z.number().min(0).default(0),
  subscription_price: z.number().min(0).default(0),
  free_messages_per_day: z.number().int().min(0).default(0),

  // Visibility & Status
  status: z.enum(['draft', 'active', 'paused', 'archived']).default('draft'),
  is_public: z.boolean().default(false),
  is_featured: z.boolean().default(false),

  // Bitcoin Payment Info
  lightning_address: lightningAddressSchema,
  bitcoin_address: z.string().optional().nullable().or(z.literal('')),
});

// Legacy schema alias for backward compatibility
export const userAIAssistantSchema = aiAssistantSchema;

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

// Asset validation
export const assetSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  type: z.enum([
    'real_estate',
    'vehicle',
    'luxury',
    'equipment',
    'computing',
    'recreational',
    'robot',
    'drone',
    'business',
    'securities',
    'other',
  ]),
  description: z.string().max(2000).optional().nullable().or(z.literal('')),
  location: z.string().max(200).optional().nullable().or(z.literal('')),
  estimated_value: z.number().positive().optional().nullable(),
  currency: z.enum(CURRENCY_CODES).optional(),
  documents: z.array(z.string().url()).optional().nullable().default([]),

  // Sale options
  is_for_sale: z.boolean().optional().default(false),
  sale_price_sats: z.number().positive().optional().nullable(),

  // Rental options
  is_for_rent: z.boolean().optional().default(false),
  rental_price_sats: z.number().positive().optional().nullable(),
  rental_period_type: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional().default('daily'),
  min_rental_period: z.number().int().positive().optional().default(1),
  max_rental_period: z.number().int().positive().optional().nullable(),

  // Deposit
  requires_deposit: z.boolean().optional().default(false),
  deposit_amount_sats: z.number().positive().optional().nullable(),

  // Visibility
  show_on_profile: z.boolean().optional().default(true),
});

// Loan validation
export const loanSchema = z.object({
  // Loan type: new_request (seeking new loan) or existing_refinance (refinancing existing)
  loan_type: z.enum(['new_request', 'existing_refinance']).default('new_request'),

  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be at most 1000 characters'),
  loan_category_id: z.string().optional().nullable().or(z.literal('')),
  original_amount: z.number().positive('Amount must be greater than 0'),
  remaining_balance: z.number().positive('Balance must be greater than 0'),
  interest_rate: z.number().min(0).max(100).optional().nullable(),
  bitcoin_address: z.string().optional().nullable().or(z.literal('')),
  lightning_address: lightningAddressSchema,
  fulfillment_type: z.enum(['manual', 'automatic']).default('manual'),
  currency: z.string().optional(),

  // Fields specific to existing loans (refinancing)
  current_lender: z.string().max(100).optional().nullable().or(z.literal('')),
  current_interest_rate: z.number().min(0).max(100).optional().nullable(),
  monthly_payment: z.number().min(0).optional().nullable(),
  desired_rate: z.number().min(0).max(100).optional().nullable(),

  // Collateral (array of collateral items)
  collateral: z.array(z.any()).optional().default([]),
});

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

// =============================================================================
// WISHLIST VALIDATION
// =============================================================================

export const wishlistSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z.string().max(1000).optional().nullable().or(z.literal('')),
  type: z
    .enum([
      'birthday',
      'wedding',
      'baby_shower',
      'graduation',
      'housewarming',
      'charity',
      'travel',
      'personal',
      'general',
    ])
    .default('general'),
  visibility: z.enum(['public', 'unlisted', 'private']).default('public'),
  event_date: z.string().or(z.date()).optional().nullable(),
  cover_image_url: z.string().url().optional().nullable().or(z.literal('')),
  is_active: z.boolean().default(true),
});

export const wishlistItemSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters'),
  description: z.string().max(1000).optional().nullable().or(z.literal('')),
  image_url: z.string().url().optional().nullable(),

  // Internal reference (mutually exclusive)
  product_id: z.string().uuid().optional().nullable(),
  service_id: z.string().uuid().optional().nullable(),
  asset_id: z.string().uuid().optional().nullable(),

  // External reference
  external_url: z.string().url().optional().nullable(),
  external_source: z.string().max(100).optional().nullable(),

  // Funding
  target_amount_sats: z.number().positive('Target amount must be positive'),
  currency: z.enum(CURRENCY_CODES).optional().default('SATS'),
  original_amount: z.number().positive().optional().nullable(),

  // Wallet routing
  use_dedicated_wallet: z.boolean().default(false),
  dedicated_wallet_address: z.string().optional().nullable(),

  // Options
  priority: z.number().int().min(0).max(100).default(0),
  allow_partial_funding: z.boolean().default(true),
  quantity_wanted: z.number().int().positive().default(1),
});

export const wishlistContributionSchema = z.object({
  wishlist_item_id: z.string().uuid(),
  amount_sats: z.number().positive('Amount must be positive'),
  message: z.string().max(500).optional().nullable(),
  is_anonymous: z.boolean().default(false),
});

export const wishlistFulfillmentProofSchema = z.object({
  wishlist_item_id: z.string().uuid(),
  proof_type: z.enum(['receipt', 'screenshot', 'transaction', 'comment']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  image_url: z.string().url().optional().nullable(),
  transaction_id: z.string().max(100).optional().nullable(),
});

export const wishlistFeedbackSchema = z
  .object({
    wishlist_item_id: z.string().uuid(),
    fulfillment_proof_id: z.string().uuid().optional().nullable(),
    feedback_type: z.enum(['like', 'dislike']),
    comment: z.string().max(500).optional().nullable(),
  })
  .refine(data => data.feedback_type !== 'dislike' || (data.comment && data.comment.length >= 10), {
    message: 'Dislikes require a comment of at least 10 characters',
    path: ['comment'],
  });

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
export type WishlistFormData = z.infer<typeof wishlistSchema>;
export type WishlistItemFormData = z.infer<typeof wishlistItemSchema>;
export type WishlistContributionFormData = z.infer<typeof wishlistContributionSchema>;
export type WishlistFulfillmentProofFormData = z.infer<typeof wishlistFulfillmentProofSchema>;
export type WishlistFeedbackFormData = z.infer<typeof wishlistFeedbackSchema>;
