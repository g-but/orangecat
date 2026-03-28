import { z } from 'zod';
import { CURRENCY_CODES } from '@/config/currencies';
import { lightningAddressSchema } from './base';

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

// Types
export type ProjectData = z.infer<typeof projectSchema>;
