import { z } from 'zod';
import { lightningAddressSchema, optionalText, optionalUrl } from './base';

/** Maximum character length for AI chat messages and system prompts */
export const AI_MESSAGE_MAX_CHARS = 10_000;

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
  description: optionalText(1000),
  category: optionalText(50),
  tags: z.array(z.string()).optional().default([]),
  avatar_url: optionalUrl(),

  // AI Configuration (the "software")
  system_prompt: z
    .string()
    .min(10, 'System prompt must be at least 10 characters')
    .max(AI_MESSAGE_MAX_CHARS, `System prompt must be at most ${AI_MESSAGE_MAX_CHARS} characters`),
  welcome_message: optionalText(500),
  personality_traits: z.array(z.string()).optional().default([]),
  knowledge_base_urls: z.array(z.string().url()).optional().default([]),

  // Model Preferences
  model_preference: z.string().max(50).default('any'),
  max_tokens_per_response: z.number().int().positive().max(32000).default(1000),
  temperature: z.number().min(0).max(2).default(0.7),

  // Compute Configuration
  compute_provider_type: z.enum(['api', 'self_hosted', 'community']).default('api'),
  compute_provider_id: z.string().uuid().optional().nullable(),
  api_provider: optionalText(50),

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
  bitcoin_address: optionalText(),
});

// Types
export type AIAssistantFormData = z.infer<typeof aiAssistantSchema>;
