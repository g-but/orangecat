/**
 * Model Registry - SSOT for All AI Models
 *
 * This registry contains metadata for all available AI models across providers.
 * It enables users to choose between free, paid, open source, and proprietary models.
 */

export interface ModelMetadata {
  id: string;
  name: string;
  provider: string;

  // Economics
  tier: 'free' | 'freemium' | 'paid';
  costPerMessage?: number; // in USD
  costPer1MTokens?: number; // in USD

  // Capabilities
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  supportsStreaming: boolean;

  // Philosophy
  type: 'open' | 'proprietary';
  license?: string;

  // Deployment
  availability: 'cloud' | 'local' | 'both';
  localRequirements?: {
    minRAM: number; // GB
    minVRAM?: number; // GB
    diskSpace: number; // GB
  };

  // Performance
  speed: 'slow' | 'medium' | 'fast' | 'instant';
  quality: 1 | 2 | 3 | 4 | 5; // stars

  // Access
  apiEndpoint: string;
  requiresApiKey: boolean;
  openRouterCompatible: boolean;
  ollamaCompatible: boolean;

  // Description
  description?: string;
}

export const MODEL_REGISTRY: Record<string, ModelMetadata> = {
  // ============================================
  // FREE TIER - Default options
  // ============================================

  'meta-llama/llama-4-maverick:free': {
    id: 'meta-llama/llama-4-maverick:free',
    name: 'Llama 4 Maverick',
    provider: 'Meta',

    tier: 'free',
    costPerMessage: 0,
    costPer1MTokens: 0,

    type: 'open',
    license: 'Llama 4 License',

    availability: 'cloud',

    contextWindow: 128000,
    maxOutputTokens: 8192,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,

    speed: 'fast',
    quality: 5,

    apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    requiresApiKey: false,
    openRouterCompatible: true,
    ollamaCompatible: false,

    description: 'Latest Llama 4 MoE model with 128 experts. Free tier: 50-1000 requests/day on OpenRouter.',
  },

  'groq/mixtral-8x7b': {
    id: 'groq/mixtral-8x7b',
    name: 'Mixtral 8x7B',
    provider: 'Groq',

    tier: 'freemium',
    costPerMessage: 0, // Free tier: 14,400 requests/day
    costPer1MTokens: 0.27,

    type: 'open',
    license: 'Apache 2.0',

    availability: 'cloud',

    contextWindow: 32768,
    maxOutputTokens: 32768,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,

    speed: 'instant',
    quality: 4,

    apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    requiresApiKey: false, // Use server key for free tier
    openRouterCompatible: false,
    ollamaCompatible: false,

    description: 'Fast, high-quality open source model. Perfect for getting started with no setup required.',
  },

  'together/llama-3.1-8b': {
    id: 'together/llama-3.1-8b',
    name: 'Llama 3.1 8B',
    provider: 'Together AI',

    tier: 'freemium',
    costPerMessage: 0,
    costPer1MTokens: 0.20,

    type: 'open',
    license: 'Llama 3.1 License',

    availability: 'both',
    localRequirements: {
      minRAM: 16,
      minVRAM: 8,
      diskSpace: 10,
    },

    contextWindow: 131072,
    maxOutputTokens: 4096,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,

    speed: 'fast',
    quality: 4,

    apiEndpoint: 'https://api.together.xyz/v1/chat/completions',
    requiresApiKey: false,
    openRouterCompatible: true,
    ollamaCompatible: true,

    description: 'Excellent balance of quality and speed. Can run locally or in the cloud.',
  },

  'google/gemini-2.0-flash': {
    id: 'google/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',

    tier: 'freemium',
    costPerMessage: 0,
    costPer1MTokens: 0.075,

    type: 'proprietary',

    availability: 'cloud',

    contextWindow: 1000000,
    maxOutputTokens: 8192,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,

    speed: 'instant',
    quality: 4,

    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    requiresApiKey: true,
    openRouterCompatible: true,
    ollamaCompatible: false,

    description: 'Massive 1M token context window. Great for analyzing large documents.',
  },

  // ============================================
  // PROPRIETARY PAID - Best Quality
  // ============================================

  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',

    tier: 'paid',
    costPerMessage: 0.03,
    costPer1MTokens: 5.00,

    type: 'proprietary',

    availability: 'cloud',

    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,

    speed: 'medium',
    quality: 5,

    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    requiresApiKey: true,
    openRouterCompatible: true,
    ollamaCompatible: false,

    description: 'Top-tier model with vision and function calling. Best overall performance.',
  },

  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',

    tier: 'paid',
    costPerMessage: 0.002,
    costPer1MTokens: 0.15,

    type: 'proprietary',

    availability: 'cloud',

    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,

    speed: 'fast',
    quality: 4,

    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    requiresApiKey: true,
    openRouterCompatible: true,
    ollamaCompatible: false,

    description: 'Affordable GPT-4 quality. Great value for most use cases.',
  },

  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',

    tier: 'paid',
    costPerMessage: 0.03,
    costPer1MTokens: 3.00,

    type: 'proprietary',

    availability: 'cloud',

    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,

    speed: 'medium',
    quality: 5,

    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    requiresApiKey: true,
    openRouterCompatible: true,
    ollamaCompatible: false,

    description: 'Exceptional reasoning and analysis. 200k context window.',
  },

  'xai/grok-beta': {
    id: 'xai/grok-beta',
    name: 'Grok',
    provider: 'X.AI',

    tier: 'paid',
    costPerMessage: 0.02,
    costPer1MTokens: 5.00,

    type: 'proprietary',

    availability: 'cloud',

    contextWindow: 131072,
    maxOutputTokens: 4096,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,

    speed: 'fast',
    quality: 4,

    apiEndpoint: 'https://api.x.ai/v1/chat/completions',
    requiresApiKey: true,
    openRouterCompatible: true,
    ollamaCompatible: false,

    description: 'Fast, witty responses. Real-time access to X/Twitter context.',
  },

  // ============================================
  // OPEN SOURCE - Run Locally
  // ============================================

  'local/llama-3.1-8b': {
    id: 'local/llama-3.1-8b',
    name: 'Llama 3.1 8B (Local)',
    provider: 'Meta (via Ollama)',

    tier: 'free',
    costPerMessage: 0,

    type: 'open',
    license: 'Llama 3.1 License',

    availability: 'local',
    localRequirements: {
      minRAM: 16,
      minVRAM: 8,
      diskSpace: 10,
    },

    contextWindow: 131072,
    maxOutputTokens: 4096,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,

    speed: 'medium',
    quality: 4,

    apiEndpoint: 'http://localhost:11434/api/chat',
    requiresApiKey: false,
    openRouterCompatible: false,
    ollamaCompatible: true,

    description: '100% private. Runs on your computer. No data sent to cloud.',
  },

  'local/mistral-7b': {
    id: 'local/mistral-7b',
    name: 'Mistral 7B (Local)',
    provider: 'Mistral AI (via Ollama)',

    tier: 'free',
    costPerMessage: 0,

    type: 'open',
    license: 'Apache 2.0',

    availability: 'local',
    localRequirements: {
      minRAM: 8,
      minVRAM: 6,
      diskSpace: 5,
    },

    contextWindow: 32768,
    maxOutputTokens: 8192,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,

    speed: 'fast',
    quality: 3,

    apiEndpoint: 'http://localhost:11434/api/chat',
    requiresApiKey: false,
    openRouterCompatible: false,
    ollamaCompatible: true,

    description: 'Lightweight local model. Good for lower-end hardware.',
  },

  'local/llama-3.1-70b': {
    id: 'local/llama-3.1-70b',
    name: 'Llama 3.1 70B (Local)',
    provider: 'Meta (via Ollama)',

    tier: 'free',
    costPerMessage: 0,

    type: 'open',
    license: 'Llama 3.1 License',

    availability: 'local',
    localRequirements: {
      minRAM: 64,
      minVRAM: 48,
      diskSpace: 40,
    },

    contextWindow: 131072,
    maxOutputTokens: 4096,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,

    speed: 'slow',
    quality: 5,

    apiEndpoint: 'http://localhost:11434/api/chat',
    requiresApiKey: false,
    openRouterCompatible: false,
    ollamaCompatible: true,

    description: 'Highest quality local model. Requires powerful hardware.',
  },

  // ============================================
  // OPENROUTER - Universal Access
  // ============================================

  'openrouter/auto': {
    id: 'openrouter/auto',
    name: 'OpenRouter Auto',
    provider: 'OpenRouter',

    tier: 'freemium',
    costPerMessage: 0.001, // Varies by selected model

    type: 'open', // Mixed (aggregator)

    availability: 'cloud',

    contextWindow: 200000, // Varies
    maxOutputTokens: 16384, // Varies
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,

    speed: 'medium',
    quality: 5,

    apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    requiresApiKey: true,
    openRouterCompatible: true,
    ollamaCompatible: false,

    description: 'Access 200+ models with one API key. Automatic fallbacks and best pricing.',
  },
};

/**
 * Get all models matching criteria
 */
export function getModels(filters?: {
  tier?: 'free' | 'freemium' | 'paid';
  type?: 'open' | 'proprietary';
  availability?: 'cloud' | 'local' | 'both';
}): ModelMetadata[] {
  const models = Object.values(MODEL_REGISTRY);

  if (!filters) return models;

  return models.filter(model => {
    if (filters.tier && model.tier !== filters.tier) return false;
    if (filters.type && model.type !== filters.type) return false;
    if (filters.availability) {
      if (filters.availability !== 'both' && model.availability !== filters.availability && model.availability !== 'both') {
        return false;
      }
    }
    return true;
  });
}

/**
 * Get recommended models based on user context
 */
export function getRecommendedModels(context?: {
  budget?: 'free' | 'low' | 'medium' | 'high';
  privacy?: 'public' | 'private' | 'paranoid';
  hardware?: {
    ram: number;
    vram?: number;
  };
}): ModelMetadata[] {
  const recommendations: ModelMetadata[] = [];

  // Always recommend free tier first
  recommendations.push(MODEL_REGISTRY['groq/mixtral-8x7b']);

  // Privacy-conscious users
  if (context?.privacy === 'paranoid') {
    if (context?.hardware?.ram && context.hardware.ram >= 16) {
      recommendations.push(MODEL_REGISTRY['local/llama-3.1-8b']);
    }
    if (context?.hardware?.ram && context.hardware.ram >= 64) {
      recommendations.push(MODEL_REGISTRY['local/llama-3.1-70b']);
    }
    return recommendations;
  }

  // Budget users
  if (!context?.budget || context.budget === 'free') {
    recommendations.push(MODEL_REGISTRY['google/gemini-2.0-flash']);
    if (context?.hardware?.ram && context.hardware.ram >= 16) {
      recommendations.push(MODEL_REGISTRY['local/llama-3.1-8b']);
    }
  }

  // Quality seekers
  if (context?.budget === 'medium' || context?.budget === 'high') {
    recommendations.push(MODEL_REGISTRY['anthropic/claude-3.5-sonnet']);
    recommendations.push(MODEL_REGISTRY['openai/gpt-4o']);
    recommendations.push(MODEL_REGISTRY['openrouter/auto']);
  }

  return recommendations;
}

/**
 * Get default model for free tier
 */
export function getDefaultModel(): ModelMetadata {
  return MODEL_REGISTRY['groq/mixtral-8x7b'];
}
