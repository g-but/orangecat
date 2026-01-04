/**
 * AI Assistant CRUD API Routes
 *
 * Uses generic entity handler from lib/api/entityCrudHandler.ts
 * Entity metadata comes from entity-registry (Single Source of Truth)
 *
 * AI Assistants are autonomous AI services that creators build and monetize.
 * They support multiple compute providers (API, self-hosted, community)
 * and flexible pricing models (per-message, per-token, subscription).
 */

import { aiAssistantSchema } from '@/lib/validation';
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import { createUpdatePayloadBuilder } from '@/lib/api/buildUpdatePayload';

// Build update payload from validated AI assistant data
const buildAIAssistantUpdatePayload = createUpdatePayloadBuilder([
  // Basic Info
  { from: 'title' },
  { from: 'description' },
  { from: 'category' },
  { from: 'tags', default: [] },
  { from: 'avatar_url' },
  // AI Configuration
  { from: 'system_prompt' },
  { from: 'welcome_message' },
  { from: 'personality_traits', default: [] },
  { from: 'knowledge_base_urls', default: [] },
  // Model Preferences
  { from: 'model_preference', default: 'any' },
  { from: 'max_tokens_per_response', default: 1000 },
  { from: 'temperature', default: 0.7 },
  // Compute Configuration
  { from: 'compute_provider_type', default: 'api' },
  { from: 'compute_provider_id' },
  { from: 'api_provider' },
  // Pricing
  { from: 'pricing_model', default: 'per_message' },
  { from: 'price_per_message_sats', default: 0 },
  { from: 'price_per_1k_tokens_sats', default: 0 },
  { from: 'subscription_price_sats', default: 0 },
  { from: 'free_messages_per_day', default: 0 },
  // Visibility & Status
  { from: 'status', default: 'draft' },
  { from: 'is_public', default: false },
  { from: 'is_featured', default: false },
  // Bitcoin Payment Info
  { from: 'lightning_address' },
  { from: 'bitcoin_address' },
]);

// Create handlers using generic factory
const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'ai_assistant',
  schema: aiAssistantSchema,
  buildUpdatePayload: buildAIAssistantUpdatePayload,
  requireActiveStatus: false, // Allow viewing draft assistants by owner
});

export { GET, PUT, DELETE };

