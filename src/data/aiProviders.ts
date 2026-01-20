/**
 * AI Provider Registry
 *
 * Single source of truth for AI provider data.
 * Similar to walletProviders.ts but for AI API providers.
 *
 * Created: 2026-01-20
 */

export interface AIProvider {
  id: string;
  name: string;
  type: 'aggregator' | 'direct';
  description: string;
  longDescription: string;
  pros: string[];
  cons: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  logoUrl?: string;
  websiteUrl: string;
  apiKeyUrl: string;
  pricingUrl: string;
  docsUrl: string;
  features: string[];
  supportedModels: string[];
  billingType: 'prepaid' | 'postpaid' | 'both';
  minimumDeposit?: number;
  setupTime: number; // minutes
  recommended?: boolean;
  rating: number;
  reviewCount: number;
  lastUpdated: string;
  verified: boolean;
  apiKeyPrefix?: string;
  apiKeyExample?: string;
}

export const aiProviders: AIProvider[] = [
  // Aggregators
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'aggregator',
    description: 'One API key for all major AI models. Best for beginners.',
    longDescription:
      'OpenRouter provides unified access to all major AI models (Claude, GPT-4, Llama, Gemini, and more) through a single API key. Pay only for what you use with transparent per-token pricing.',
    pros: [
      'Single API key for 100+ models',
      'Simple prepaid billing - no surprises',
      'Automatic fallbacks between models',
      'Free tier available with rate limits',
      'Transparent token-based pricing',
      'No monthly minimums or subscriptions',
    ],
    cons: [
      'Slightly higher prices than direct providers',
      'Adds a middleman layer',
      'Some models may have limited features',
    ],
    difficulty: 'beginner',
    websiteUrl: 'https://openrouter.ai',
    apiKeyUrl: 'https://openrouter.ai/keys',
    pricingUrl: 'https://openrouter.ai/models',
    docsUrl: 'https://openrouter.ai/docs',
    features: [
      'Multi-model access',
      'Prepaid credits',
      'Usage dashboard',
      'Model comparison',
      'Automatic retries',
      'Free models available',
    ],
    supportedModels: [
      'Claude 3.5 Sonnet',
      'Claude 3 Opus',
      'GPT-4o',
      'GPT-4 Turbo',
      'Llama 4',
      'Gemini 2.0',
      'DeepSeek',
      '100+ more',
    ],
    billingType: 'prepaid',
    minimumDeposit: 5,
    setupTime: 2,
    recommended: true,
    rating: 4.8,
    reviewCount: 12500,
    lastUpdated: '2026-01-15',
    verified: true,
    apiKeyPrefix: 'sk-or-',
    apiKeyExample: 'sk-or-v1-xxxxxxxxxxxxxxxx',
  },

  // Direct Providers
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'direct',
    description: 'Direct access to Claude models from the creators.',
    longDescription:
      'Anthropic is the company behind Claude, known for AI safety research. Direct API access gives you the latest features and lowest latency for Claude models.',
    pros: [
      'Direct from Claude creators',
      'Latest features first',
      'Lower latency',
      'Detailed usage analytics',
      'Priority support available',
    ],
    cons: [
      'Only Claude models available',
      'Credit card required',
      'Pay-as-you-go billing',
      'More complex rate limits',
    ],
    difficulty: 'intermediate',
    websiteUrl: 'https://anthropic.com',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    pricingUrl: 'https://www.anthropic.com/pricing',
    docsUrl: 'https://docs.anthropic.com',
    features: [
      'Latest Claude features',
      'Low latency',
      'Usage analytics',
      'Rate limit management',
      'Workspaces',
    ],
    supportedModels: [
      'Claude 3.5 Sonnet',
      'Claude 3.5 Haiku',
      'Claude 3 Opus',
      'Claude 3 Haiku',
      'Claude Sonnet 4',
      'Claude Opus 4',
    ],
    billingType: 'postpaid',
    setupTime: 5,
    recommended: false,
    rating: 4.7,
    reviewCount: 8900,
    lastUpdated: '2026-01-10',
    verified: true,
    apiKeyPrefix: 'sk-ant-',
    apiKeyExample: 'sk-ant-api03-xxxxxxxxxxxxxxxx',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'direct',
    description: 'Direct access to GPT-4 and other OpenAI models.',
    longDescription:
      'OpenAI offers direct API access to GPT-4, GPT-4o, and other models. Known for broad capabilities including vision, function calling, and structured outputs.',
    pros: [
      'Industry-leading models',
      'Extensive documentation',
      'Large developer community',
      'Function calling support',
      'Vision capabilities',
    ],
    cons: [
      'Only OpenAI models',
      'Complex pricing tiers',
      'Rate limits can be restrictive',
      'Credit card required',
    ],
    difficulty: 'intermediate',
    websiteUrl: 'https://openai.com',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    pricingUrl: 'https://openai.com/pricing',
    docsUrl: 'https://platform.openai.com/docs',
    features: [
      'GPT-4 models',
      'Function calling',
      'Vision support',
      'Structured outputs',
      'Fine-tuning',
      'Embeddings',
    ],
    supportedModels: ['GPT-4o', 'GPT-4o Mini', 'GPT-4 Turbo', 'GPT-3.5 Turbo'],
    billingType: 'both',
    minimumDeposit: 5,
    setupTime: 5,
    recommended: false,
    rating: 4.6,
    reviewCount: 15200,
    lastUpdated: '2026-01-12',
    verified: true,
    apiKeyPrefix: 'sk-',
    apiKeyExample: 'sk-proj-xxxxxxxxxxxxxxxx',
  },
  {
    id: 'google',
    name: 'Google AI Studio',
    type: 'direct',
    description: 'Direct access to Gemini models from Google.',
    longDescription:
      'Google AI Studio provides access to Gemini models with massive context windows (up to 2M tokens) and strong multimodal capabilities.',
    pros: [
      'Massive context window',
      'Strong multimodal support',
      'Competitive pricing',
      'Free tier available',
      'Good documentation',
    ],
    cons: [
      'Only Google models',
      'Newer platform',
      'Some features in preview',
      'Rate limits on free tier',
    ],
    difficulty: 'intermediate',
    websiteUrl: 'https://ai.google.dev',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    pricingUrl: 'https://ai.google.dev/pricing',
    docsUrl: 'https://ai.google.dev/docs',
    features: [
      'Large context window',
      'Multimodal support',
      'Grounding',
      'Code execution',
      'Free tier',
    ],
    supportedModels: ['Gemini 2.0 Flash', 'Gemini 2.0 Pro', 'Gemini 1.5 Flash', 'Gemini 1.5 Pro'],
    billingType: 'both',
    setupTime: 3,
    recommended: false,
    rating: 4.5,
    reviewCount: 6800,
    lastUpdated: '2026-01-08',
    verified: true,
    apiKeyPrefix: 'AIza',
    apiKeyExample: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
];

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get provider by ID
 */
export function getAIProvider(id: string): AIProvider | undefined {
  return aiProviders.find(p => p.id === id);
}

/**
 * Get recommended provider
 */
export function getRecommendedProvider(): AIProvider {
  return aiProviders.find(p => p.recommended) || aiProviders[0];
}

/**
 * Get providers by type
 */
export function getProvidersByType(type: AIProvider['type']): AIProvider[] {
  return aiProviders.filter(p => p.type === type);
}

/**
 * Get providers by difficulty
 */
export function getProvidersByDifficulty(difficulty: AIProvider['difficulty']): AIProvider[] {
  return aiProviders.filter(p => p.difficulty === difficulty);
}

/**
 * Get aggregator providers (easier for beginners)
 */
export function getAggregatorProviders(): AIProvider[] {
  return getProvidersByType('aggregator');
}

/**
 * Get direct providers
 */
export function getDirectProviders(): AIProvider[] {
  return getProvidersByType('direct');
}

/**
 * Validate API key format for a provider
 */
export function validateApiKeyFormat(
  providerId: string,
  apiKey: string
): { valid: boolean; message?: string } {
  const provider = getAIProvider(providerId);
  if (!provider) {
    return { valid: false, message: 'Unknown provider' };
  }

  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, message: 'API key is required' };
  }

  // Check prefix if provider has one
  if (provider.apiKeyPrefix && !apiKey.startsWith(provider.apiKeyPrefix)) {
    return {
      valid: false,
      message: `API key should start with "${provider.apiKeyPrefix}"`,
    };
  }

  // Basic length validation
  if (apiKey.length < 20) {
    return { valid: false, message: 'API key seems too short' };
  }

  return { valid: true };
}

// ==================== CONSTANTS ====================

/** Default provider ID */
export const DEFAULT_PROVIDER_ID = 'openrouter';

/** Provider type labels */
export const PROVIDER_TYPE_LABELS: Record<AIProvider['type'], string> = {
  aggregator: 'Aggregator',
  direct: 'Direct Provider',
};

/** Provider difficulty labels */
export const PROVIDER_DIFFICULTY_LABELS: Record<AIProvider['difficulty'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

/** Provider difficulty descriptions */
export const PROVIDER_DIFFICULTY_DESCRIPTIONS: Record<AIProvider['difficulty'], string> = {
  beginner: 'Easy to set up, simple billing, great documentation',
  intermediate: 'Requires some technical knowledge, more configuration options',
  advanced: 'For power users, complex billing, advanced features',
};
