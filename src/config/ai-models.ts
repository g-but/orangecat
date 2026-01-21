/**
 * AI Model Registry - Single Source of Truth
 *
 * Central registry for all AI models available through OpenRouter.
 * Follows the ENTITY_REGISTRY pattern for consistency.
 *
 * Includes FREE models (with :free suffix) that have no API cost.
 * Free models have rate limits: 50/day (free accounts) or 1000/day ($10+ balance)
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-08
 */

// ==================== TYPES ====================

export const MODEL_TIERS = ['free', 'economy', 'standard', 'premium'] as const;
export type ModelTier = (typeof MODEL_TIERS)[number];

export const MODEL_CAPABILITIES = [
  'text',
  'vision',
  'function_calling',
  'json_mode',
  'streaming',
] as const;
export type ModelCapability = (typeof MODEL_CAPABILITIES)[number];

export interface AIModelMetadata {
  /** OpenRouter model ID (e.g., 'anthropic/claude-3-opus') */
  id: string;
  /** Display name */
  name: string;
  /** Provider (e.g., 'Anthropic', 'OpenAI') */
  provider: string;
  /** Short description */
  description: string;
  /** Context window size in tokens */
  contextWindow: number;
  /** Max output tokens */
  maxOutputTokens: number;
  /** Input cost per 1M tokens in USD (0 for free models) */
  inputCostPer1M: number;
  /** Output cost per 1M tokens in USD (0 for free models) */
  outputCostPer1M: number;
  /** Model capabilities */
  capabilities: ModelCapability[];
  /** Performance tier for auto-routing */
  tier: ModelTier;
  /** Recommended for specific use cases */
  recommendedFor: string[];
  /** Whether model is available/enabled */
  isAvailable: boolean;
  /** Whether this is a free model (no API cost) */
  isFree?: boolean;
  /** Rate limit info for free models */
  rateLimit?: string;
}

// ==================== MODEL REGISTRY ====================

export const AI_MODEL_REGISTRY: Record<string, AIModelMetadata> = {
  // ==================== FREE TIER ====================
  // No API cost - rate limited (50-1000/day depending on account)
  // Updated 2026-01-20 with verified OpenRouter free models

  'meta-llama/llama-3.3-70b-instruct:free': {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Free)',
    provider: 'Meta',
    description: 'Powerful 70B parameter model - free tier',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    capabilities: ['text', 'streaming'],
    tier: 'free',
    recommendedFor: ['complex reasoning', 'detailed analysis', 'coding'],
    isAvailable: true,
    isFree: true,
    rateLimit: '50-1000/day',
  },

  'google/gemini-2.0-flash-exp:free': {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (Free)',
    provider: 'Google',
    description: 'Fast multimodal model - free experimental tier',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    capabilities: ['text', 'vision', 'streaming'],
    tier: 'free',
    recommendedFor: ['multimodal', 'large context', 'fast responses'],
    isAvailable: true,
    isFree: true,
    rateLimit: '50-1000/day',
  },

  'google/gemma-3-27b-it:free': {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B (Free)',
    provider: 'Google',
    description: 'Open-weights Google model - free tier',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    capabilities: ['text', 'streaming'],
    tier: 'free',
    recommendedFor: ['general purpose', 'instruction following'],
    isAvailable: true,
    isFree: true,
    rateLimit: '50-1000/day',
  },

  'deepseek/deepseek-r1-0528:free': {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1 (Free)',
    provider: 'DeepSeek',
    description: 'Reasoning-focused model - free tier',
    contextWindow: 64000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    capabilities: ['text', 'streaming'],
    tier: 'free',
    recommendedFor: ['complex reasoning', 'math', 'logic'],
    isAvailable: true,
    isFree: true,
    rateLimit: '50-1000/day',
  },

  'mistralai/mistral-small-3.1-24b-instruct:free': {
    id: 'mistralai/mistral-small-3.1-24b-instruct:free',
    name: 'Mistral Small 3.1 (Free)',
    provider: 'Mistral',
    description: 'Efficient Mistral model - free tier',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    capabilities: ['text', 'streaming'],
    tier: 'free',
    recommendedFor: ['coding', 'general purpose', 'fast responses'],
    isAvailable: true,
    isFree: true,
    rateLimit: '50-1000/day',
  },

  'qwen/qwen3-4b:free': {
    id: 'qwen/qwen3-4b:free',
    name: 'Qwen 3 4B (Free)',
    provider: 'Alibaba',
    description: 'Lightweight Qwen model - free tier',
    contextWindow: 32000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    capabilities: ['text', 'streaming'],
    tier: 'free',
    recommendedFor: ['quick responses', 'simple tasks'],
    isAvailable: true,
    isFree: true,
    rateLimit: '50-1000/day',
  },

  // ==================== ECONOMY TIER ====================
  // Fast & cheap for simple tasks

  'google/gemini-2.0-flash-lite': {
    id: 'google/gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    provider: 'Google',
    description: 'Fastest, cheapest model for simple tasks',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.3,
    capabilities: ['text', 'streaming'],
    tier: 'economy',
    recommendedFor: ['simple questions', 'quick responses', 'high volume'],
    isAvailable: true,
  },

  'anthropic/claude-3-haiku': {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fast and efficient for everyday tasks',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    capabilities: ['text', 'vision', 'streaming'],
    tier: 'economy',
    recommendedFor: ['customer support', 'quick analysis', 'summarization'],
    isAvailable: true,
  },

  'anthropic/claude-3.5-haiku': {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    description: 'Upgraded Haiku with better reasoning',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputCostPer1M: 1.0,
    outputCostPer1M: 5.0,
    capabilities: ['text', 'vision', 'streaming'],
    tier: 'economy',
    recommendedFor: ['coding', 'analysis', 'creative writing'],
    isAvailable: true,
  },

  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Affordable GPT-4 level intelligence',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    capabilities: ['text', 'vision', 'function_calling', 'json_mode', 'streaming'],
    tier: 'economy',
    recommendedFor: ['general purpose', 'structured output', 'vision'],
    isAvailable: true,
  },

  // ==================== STANDARD TIER ====================
  // Balanced performance & cost

  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Best balance of speed, quality, and cost',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    capabilities: ['text', 'vision', 'function_calling', 'streaming'],
    tier: 'standard',
    recommendedFor: ['coding', 'analysis', 'creative writing', 'research'],
    isAvailable: true,
  },

  'anthropic/claude-sonnet-4': {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    description: 'Latest Sonnet with improved capabilities',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    capabilities: ['text', 'vision', 'function_calling', 'streaming'],
    tier: 'standard',
    recommendedFor: ['coding', 'analysis', 'complex reasoning'],
    isAvailable: true,
  },

  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Versatile multimodal model',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputCostPer1M: 2.5,
    outputCostPer1M: 10.0,
    capabilities: ['text', 'vision', 'function_calling', 'json_mode', 'streaming'],
    tier: 'standard',
    recommendedFor: ['general purpose', 'vision tasks', 'structured output'],
    isAvailable: true,
  },

  'google/gemini-2.0-flash': {
    id: 'google/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Fast multimodal with large context',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.4,
    capabilities: ['text', 'vision', 'function_calling', 'streaming'],
    tier: 'standard',
    recommendedFor: ['large documents', 'multimodal', 'fast responses'],
    isAvailable: true,
  },

  // ==================== PREMIUM TIER ====================
  // Maximum capability for complex tasks

  'anthropic/claude-3-opus': {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Most capable for complex reasoning',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
    capabilities: ['text', 'vision', 'function_calling', 'streaming'],
    tier: 'premium',
    recommendedFor: ['complex reasoning', 'research', 'nuanced analysis'],
    isAvailable: true,
  },

  'anthropic/claude-opus-4': {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    description: 'Latest Opus with breakthrough capabilities',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
    capabilities: ['text', 'vision', 'function_calling', 'streaming'],
    tier: 'premium',
    recommendedFor: ['complex reasoning', 'research', 'expert-level tasks'],
    isAvailable: true,
  },

  'openai/gpt-4-turbo': {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'High capability with vision support',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputCostPer1M: 10.0,
    outputCostPer1M: 30.0,
    capabilities: ['text', 'vision', 'function_calling', 'json_mode', 'streaming'],
    tier: 'premium',
    recommendedFor: ['complex tasks', 'vision', 'tool use'],
    isAvailable: true,
  },

  'google/gemini-2.0-pro': {
    id: 'google/gemini-2.0-pro',
    name: 'Gemini 2.0 Pro',
    provider: 'Google',
    description: "Google's most capable model",
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.0,
    capabilities: ['text', 'vision', 'function_calling', 'streaming'],
    tier: 'premium',
    recommendedFor: ['very large context', 'complex analysis', 'multimodal'],
    isAvailable: true,
  },

  'x-ai/grok-2': {
    id: 'x-ai/grok-2',
    name: 'Grok 2',
    provider: 'xAI',
    description: 'Real-time knowledge with wit',
    contextWindow: 131072,
    maxOutputTokens: 8192,
    inputCostPer1M: 2.0,
    outputCostPer1M: 10.0,
    capabilities: ['text', 'function_calling', 'streaming'],
    tier: 'premium',
    recommendedFor: ['current events', 'creative tasks', 'reasoning'],
    isAvailable: true,
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get metadata for a specific model
 */
export function getModelMetadata(modelId: string): AIModelMetadata | undefined {
  return AI_MODEL_REGISTRY[modelId];
}

/**
 * Get all models for a specific tier
 */
export function getModelsByTier(tier: ModelTier): AIModelMetadata[] {
  return Object.values(AI_MODEL_REGISTRY).filter(m => m.tier === tier && m.isAvailable);
}

/**
 * Get all available models
 */
export function getAvailableModels(): AIModelMetadata[] {
  return Object.values(AI_MODEL_REGISTRY).filter(m => m.isAvailable);
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: string): AIModelMetadata[] {
  return Object.values(AI_MODEL_REGISTRY).filter(
    m => m.provider.toLowerCase() === provider.toLowerCase() && m.isAvailable
  );
}

/**
 * Get models with a specific capability
 */
export function getModelsWithCapability(capability: ModelCapability): AIModelMetadata[] {
  return Object.values(AI_MODEL_REGISTRY).filter(
    m => m.capabilities.includes(capability) && m.isAvailable
  );
}

/**
 * Calculate cost in satoshis for a given model and token usage
 *
 * @param modelId - The model ID
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param btcPriceUsd - Current BTC price in USD (default: 100000)
 * @returns Cost in satoshis
 */
export function calculateCostSats(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  btcPriceUsd: number = 100000
): number {
  const model = AI_MODEL_REGISTRY[modelId];
  if (!model) {
    return 0;
  }

  const inputCostUsd = (inputTokens / 1_000_000) * model.inputCostPer1M;
  const outputCostUsd = (outputTokens / 1_000_000) * model.outputCostPer1M;
  const totalCostUsd = inputCostUsd + outputCostUsd;

  // Convert USD to sats (1 BTC = 100M sats)
  const satsPerUsd = 100_000_000 / btcPriceUsd;
  return Math.ceil(totalCostUsd * satsPerUsd);
}

/**
 * Estimate cost in satoshis for a message before sending
 *
 * @param modelId - The model ID
 * @param inputText - The input text to estimate tokens for
 * @param estimatedOutputTokens - Estimated output tokens (default: 500)
 * @param btcPriceUsd - Current BTC price in USD
 * @returns Estimated cost in satoshis
 */
export function estimateCostSats(
  modelId: string,
  inputText: string,
  estimatedOutputTokens: number = 500,
  btcPriceUsd: number = 100000
): number {
  // Rough token estimate: ~4 characters per token
  const estimatedInputTokens = Math.ceil(inputText.length / 4);
  return calculateCostSats(modelId, estimatedInputTokens, estimatedOutputTokens, btcPriceUsd);
}

/**
 * Get the default model for a tier
 */
export function getDefaultModelForTier(tier: ModelTier): AIModelMetadata {
  const models = getModelsByTier(tier);
  // Return cheapest available model in tier
  return models.sort((a, b) => a.inputCostPer1M - b.inputCostPer1M)[0];
}

/**
 * Get all unique providers
 */
export function getAllProviders(): string[] {
  const providers = new Set<string>();
  Object.values(AI_MODEL_REGISTRY).forEach(m => providers.add(m.provider));
  return Array.from(providers).sort();
}

// ==================== CONSTANTS ====================

/** Default model for Auto mode fallback (free model) */
export const DEFAULT_MODEL_ID = 'meta-llama/llama-3.3-70b-instruct:free';

/** Default free model for platform usage */
export const DEFAULT_FREE_MODEL_ID = 'meta-llama/llama-3.3-70b-instruct:free';

/** Default BTC price for cost calculations (updated periodically) */
export const DEFAULT_BTC_PRICE_USD = 100000;

/** Platform daily limit for free tier users */
export const PLATFORM_DAILY_LIMIT = 10;

/** Tier display configuration */
export const TIER_CONFIG: Record<
  ModelTier,
  { label: string; description: string; color: string; badge?: string }
> = {
  free: {
    label: 'Free',
    description: 'No API cost - rate limited',
    color: 'emerald',
    badge: 'FREE',
  },
  economy: {
    label: 'Economy',
    description: 'Fast & affordable for simple tasks',
    color: 'green',
  },
  standard: {
    label: 'Standard',
    description: 'Balanced performance & cost',
    color: 'blue',
  },
  premium: {
    label: 'Premium',
    description: 'Maximum capability for complex tasks',
    color: 'purple',
  },
};

/**
 * Get all free models
 */
export function getFreeModels(): AIModelMetadata[] {
  return Object.values(AI_MODEL_REGISTRY).filter(m => m.isFree === true && m.isAvailable);
}

/**
 * Check if a model is free
 */
export function isModelFree(modelId: string): boolean {
  const model = AI_MODEL_REGISTRY[modelId];
  return model?.isFree === true;
}
