import { z } from 'zod';
import { CURRENCY_CODES } from '@/config/currencies';
import { optionalText, optionalUrl } from './base';

// =============================================================================
// WISHLIST VALIDATION
// =============================================================================

export const wishlistSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: optionalText(1000),
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
  cover_image_url: optionalUrl(),
  is_active: z.boolean().default(true),
});

export const wishlistItemSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters'),
  description: optionalText(1000),
  image_url: z.string().url().optional().nullable(),

  // Internal reference (mutually exclusive)
  product_id: z.string().uuid().optional().nullable(),
  service_id: z.string().uuid().optional().nullable(),
  asset_id: z.string().uuid().optional().nullable(),

  // External reference
  external_url: z.string().url().optional().nullable(),
  external_source: z.string().max(100).optional().nullable(),

  // Funding
  target_amount_sats: z
    .number()
    .int('Amount must be whole satoshis')
    .positive('Target amount must be positive'),
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
  amount_sats: z.number().int('Amount must be whole satoshis').positive('Amount must be positive'),
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

// Types
export type WishlistFormData = z.infer<typeof wishlistSchema>;
export type WishlistItemFormData = z.infer<typeof wishlistItemSchema>;
export type WishlistContributionFormData = z.infer<typeof wishlistContributionSchema>;
export type WishlistFulfillmentProofFormData = z.infer<typeof wishlistFulfillmentProofSchema>;
export type WishlistFeedbackFormData = z.infer<typeof wishlistFeedbackSchema>;
