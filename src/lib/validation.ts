import { z } from 'zod';
import { validatePhoneNumber, normalizePhoneNumber } from './phone-validation';

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

// Helper function to normalize profile data
export function normalizeProfileData(data: any): ProfileData {
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
        (link: any) => link && link.value && link.value.trim()
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

export type ProfileData = z.infer<typeof profileSchema>;
export type ProjectData = z.infer<typeof projectSchema>;
export type TransactionData = z.infer<typeof transactionSchema>;
