import { z } from 'zod';
import { CURRENCY_CODES } from '@/config/currencies';
import { lightningAddressSchema, optionalText } from './base';

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
  category: optionalText(),
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
  start_date: optionalText(),
  target_completion: optionalText(),
});

// Types
export type ProjectData = z.infer<typeof projectSchema>;

// Project wizard form schema — used by CreateProjectForm.
// Different shape from projectSchema: goal_amount is a string (raw input), tags is a comma-separated string.
import { isValidBitcoinAddress } from '@/utils/validation';
export const projectFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  bitcoin_address: z.string().refine(isValidBitcoinAddress, 'Invalid Bitcoin address'),
  website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  goal_amount: z
    .string()
    .refine(val => !isNaN(parseFloat(val)), 'Invalid number')
    .optional()
    .or(z.literal('')),
  tags: z.string().optional(),
  banner_url: z.string().optional(),
  gallery_images: z.array(z.string()).optional(),
});
export type ProjectFormValues = z.infer<typeof projectFormSchema>;
