import { z } from 'zod';
import { CURRENCY_CODES } from '@/config/currencies';
import { lightningAddressSchema, optionalText, optionalUrl } from './base';

// =============================================================================
// REUSABLE SUB-SCHEMAS FOR JSON FIELDS
// =============================================================================

/**
 * Availability schedule for services.
 * Matches AvailabilitySchedule interface in domain/commerce/service.ts.
 * Stored as JSONB in the database.
 *
 * Uses .passthrough() to allow additional fields without breaking existing data.
 */
export const availabilityScheduleSchema = z
  .object({
    days: z
      .array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']))
      .optional(),
    hours: z
      .array(
        z.object({
          start: z.string().max(10),
          end: z.string().max(10),
        })
      )
      .optional(),
    timezone: z.string().max(100).optional(),
  })
  .passthrough();

/**
 * Distribution rules for causes.
 * Matches DistributionRules interface in domain/commerce/service.ts.
 * Stored as JSONB in the database.
 *
 * Uses .passthrough() to allow additional fields without breaking existing data.
 */
export const distributionRulesSchema = z
  .object({
    type: z.enum(['equal', 'weighted', 'custom']).optional(),
    allocations: z.record(z.string(), z.number()).optional(),
  })
  .passthrough();

/**
 * Beneficiary in a cause.
 * Matches Beneficiary interface in domain/commerce/service.ts.
 * Stored as JSONB array in the database.
 *
 * Uses .passthrough() to allow additional fields without breaking existing data.
 */
export const beneficiarySchema = z
  .object({
    id: z.string().optional(),
    name: z.string().max(200).optional(),
    address: z.string().max(500).optional(),
    share: z.number().min(0).max(100).optional(),
  })
  .passthrough();

// Personal Economy validation schemas
export const userProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: optionalText(1000),
  // Price interpretation depends on currency:
  // - SATS: Integer value in satoshis (e.g., 100000 = 100,000 sats)
  // - Fiat: Decimal value in currency units (e.g., 9.99 = $9.99)
  // For best precision with fiat, consider storing in cents and converting for display
  price: z.number().positive('Price must be positive'),
  currency: z.enum(CURRENCY_CODES).optional(),
  product_type: z.enum(['physical', 'digital', 'service']).default('physical'),
  images: z.array(z.string().url()).optional().default([]),
  thumbnail_url: optionalUrl(),
  inventory_count: z.number().int().min(-1).default(-1), // -1 = unlimited
  fulfillment_type: z.enum(['manual', 'automatic', 'digital']).default('manual'),
  category: optionalText(50),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'active', 'paused', 'sold_out']).default('draft'),
  is_featured: z.boolean().default(false),
});

export const userServiceSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
    description: optionalText(1000),
    category: z.string().min(1, 'Category is required').max(50),
    hourly_rate: z.number().positive().optional().nullable(),
    fixed_price: z.number().positive().optional().nullable(),
    currency: z.enum(CURRENCY_CODES).optional(),
    duration_minutes: z.number().positive().optional().nullable(),
    availability_schedule: availabilityScheduleSchema.optional().nullable(),
    service_location_type: z.enum(['remote', 'onsite', 'both']).default('remote'),
    service_area: optionalText(200),
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
  description: optionalText(1000),
  cause_category: z.string().min(1, 'Category is required').max(50),
  goal_amount: z.number().positive().optional().nullable(),
  currency: z.enum(CURRENCY_CODES).optional(),
  bitcoin_address: optionalText(),
  lightning_address: lightningAddressSchema,
  distribution_rules: distributionRulesSchema.optional().nullable(),
  beneficiaries: z.array(beneficiarySchema).optional().default([]),
  status: z.enum(['draft', 'active', 'completed', 'paused']).default('draft'),
});

// Types
export type UserProductFormData = z.infer<typeof userProductSchema>;
export type UserServiceFormData = z.infer<typeof userServiceSchema>;
export type UserCauseFormData = z.infer<typeof userCauseSchema>;
export type AvailabilityScheduleData = z.infer<typeof availabilityScheduleSchema>;
export type DistributionRulesData = z.infer<typeof distributionRulesSchema>;
export type BeneficiaryData = z.infer<typeof beneficiarySchema>;
