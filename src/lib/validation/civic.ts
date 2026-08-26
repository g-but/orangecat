/**
 * Civic allocation validation — jurisdictions and allocation directives.
 *
 * Two schemas mirror two database tables, and both mirror rules the database
 * also enforces. The duplication is deliberate and bounded: the database is the
 * authority (a client cannot be trusted with an invariant), but a person moving
 * sliders needs to be told "that comes to 97%" while they are still moving them,
 * not after a failed round trip. Every rule stated twice is noted as such.
 */

import { z } from 'zod';
import { optionalText, webUrl } from './base';
import { CURRENCY_CODES } from '@/config/currencies';
import {
  JURISDICTION_LEVELS,
  JURISDICTION_STATUSES,
  JURISDICTION_VERIFICATION_STATUSES,
} from '@/config/jurisdictions';
import {
  ALLOCATION_BASES,
  ALLOCATION_CADENCES,
  ALLOCATION_STATUSES,
  ALLOCATION_VISIBILITIES,
  ALLOCATION_TOTAL_PERCENT,
  isAllocationBalanced,
  allocationTotal,
} from '@/config/civic-allocation';

// ==================== JURISDICTION ====================

export const jurisdictionSchema = z.object({
  title: z.string().min(1, 'Name is required').max(160, 'Name must be at most 160 characters'),
  description: optionalText(2000),
  level: z.enum(JURISDICTION_LEVELS, {
    errorMap: () => ({ message: 'Choose which tier of government this body is' }),
  }),
  parent_id: z.string().uuid('Parent must be a valid jurisdiction').optional().nullable(),

  country_code: z
    .string()
    .regex(/^[A-Z]{2}$/, 'Country must be a 2-letter ISO code, e.g. CH')
    .optional()
    .nullable()
    .or(z.literal('')),
  region_code: optionalText(10),
  locality: optionalText(120),
  population: z.coerce
    .number()
    .int('Population must be a whole number')
    .min(0, 'Population cannot be negative')
    .optional()
    .nullable(),

  official_url: webUrl({ max: 500 }).optional().nullable().or(z.literal('')),

  currency: z.enum(CURRENCY_CODES).default('CHF'),
  annual_budget: z.coerce.number().min(0, 'Budget cannot be negative').optional().nullable(),
  budget_year: z.coerce
    .number()
    .int()
    .min(1800, 'Budget year looks wrong')
    .max(2200, 'Budget year looks wrong')
    .optional()
    .nullable(),
  budget_url: webUrl({ max: 500 }).optional().nullable().or(z.literal('')),

  // Payment rails are deliberately NOT accepted here. The columns exist on the
  // table, but only the claim flow (service role, after evidence review) may
  // write them — otherwise whoever first lists a government body attaches their
  // own wallet to it, which is the exact impersonation this directory is built
  // to make impossible.

  // Never accepted from a form. Verification is decided server-side against
  // evidence — a body that could set its own badge is not verified, it is
  // self-declared, and the badge is the only thing separating a real treasury
  // from a squatted page. Present in the schema (not merely absent) so that an
  // attempt to set it is a validation error rather than a silently dropped key.
  verification_status: z
    .enum(JURISDICTION_VERIFICATION_STATUSES)
    .optional()
    .refine(value => value === undefined || value === 'unclaimed', {
      message: 'Verification is granted after review, not set on the form',
    }),

  status: z.enum(JURISDICTION_STATUSES).default('active'),
  tags: z.array(z.string()).optional().default([]),
  avatar_url: optionalText(),
  cover_image_url: optionalText(),
});

export type JurisdictionFormData = z.infer<typeof jurisdictionSchema>;

// ==================== ALLOCATION LINE ====================

/**
 * One share of a directive. Exactly one recipient shape must be set — the same
 * "exactly one" the database enforces as civic_allocation_lines_one_recipient.
 */
export const allocationLineSchema = z
  .object({
    position: z.coerce.number().int().min(0).default(0),
    share_percent: z.coerce
      .number()
      .gt(0, 'A share must be greater than 0%')
      .max(ALLOCATION_TOTAL_PERCENT, `A share cannot exceed ${ALLOCATION_TOTAL_PERCENT}%`),

    jurisdiction_id: z.string().uuid().optional().nullable(),
    recipient_entity_type: optionalText(40),
    recipient_entity_id: z.string().uuid().optional().nullable(),
    external_name: optionalText(200),
    external_url: webUrl({ max: 500 }).optional().nullable().or(z.literal('')),

    note: optionalText(500),
  })
  .refine(
    line => {
      const shapes = [
        Boolean(line.jurisdiction_id),
        Boolean(line.recipient_entity_type && line.recipient_entity_id),
        Boolean(line.external_name),
      ].filter(Boolean).length;
      return shapes === 1;
    },
    {
      message:
        'Each line needs exactly one recipient: a government body, something on OrangeCat, or an external name',
      path: ['jurisdiction_id'],
    }
  );

export type AllocationLineFormData = z.infer<typeof allocationLineSchema>;

// ==================== ALLOCATION ====================

const allocationBase = z.object({
  title: z
    .string()
    .min(1, 'Give this directive a name')
    .max(140, 'Name must be at most 140 characters'),
  description: optionalText(2000),

  basis: z.enum(ALLOCATION_BASES).default('tax'),
  cadence: z.enum(ALLOCATION_CADENCES).default('annual'),

  period_start: optionalText(20),
  period_end: optionalText(20),

  reference_amount: z.coerce.number().min(0, 'Amount cannot be negative').optional().nullable(),
  currency: z.enum(CURRENCY_CODES).default('CHF'),

  residency_jurisdiction_id: z.string().uuid().optional().nullable(),

  // The civic argument. Long-form on purpose: a split with a stated reason is
  // something others can weigh, and weighing is what the governance layer acts on.
  rationale: optionalText(5000),

  status: z.enum(ALLOCATION_STATUSES).default('draft'),
  visibility: z.enum(ALLOCATION_VISIBILITIES).default('public'),
  show_on_profile: z.boolean().default(true),
  tags: z.array(z.string()).optional().default([]),

  lines: z.array(allocationLineSchema).default([]),
});

export const allocationSchema = allocationBase
  .refine(
    data => {
      if (!data.period_start || !data.period_end) {
        return true;
      }
      return data.period_end >= data.period_start;
    },
    { message: 'The period must end on or after it starts', path: ['period_end'] }
  )
  /**
   * The one arithmetic rule, and it applies only outside draft — exactly as
   * `civic_allocation_assert_balanced` does in SQL. Editing a split necessarily
   * passes through unbalanced states (you cannot move five points from one line
   * to another atomically), so enforcing it in draft would make the form
   * unusable. The rule a person can hold in their head: you cannot activate an
   * unbalanced split, and you cannot unbalance an active one.
   */
  .refine(data => data.status === 'draft' || data.lines.length > 0, {
    message: 'Add at least one recipient before publishing',
    path: ['lines'],
  })
  .refine(
    data =>
      data.status === 'draft' || isAllocationBalanced(data.lines.map(line => line.share_percent)),
    data => ({
      message: `Shares must total ${ALLOCATION_TOTAL_PERCENT}% to publish — currently ${allocationTotal(
        data.lines.map(line => line.share_percent)
      )}%`,
      path: ['lines'],
    })
  );

export type AllocationFormData = z.infer<typeof allocationSchema>;

/** Payload shape for POST/PUT of the lines sub-resource. */
export const allocationLinesPayloadSchema = z.object({
  lines: z.array(allocationLineSchema).max(50, 'An allocation can hold at most 50 lines'),
});

export type AllocationLinesPayload = z.infer<typeof allocationLinesPayloadSchema>;
