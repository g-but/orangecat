/**
 * MODEL SELECTION GUIDANCE - SSOT
 *
 * Single source of truth for model selection guidance and recommendations.
 * Used by ModelSelector component to help users choose the right AI model.
 *
 * Created: 2026-01-18
 * Last Modified: 2026-01-18
 */

import { Zap, Crown, Gauge, Brain } from 'lucide-react';

// ==================== TYPES ====================

export interface ModelGuidance {
  title: string;
  description: string;
  icon: any;
  tips: string[];
  useCases: string[];
  tradeoffs?: {
    pros: string[];
    cons: string[];
  };
}

export interface ModelRecommendation {
  modelId: string;
  reason: string;
  useCase: string;
}

// ==================== DEFAULT GUIDANCE ====================

export const DEFAULT_MODEL_GUIDANCE = {
  title: 'Choose Your AI Model',
  description: 'Select the AI model that best fits your needs. Default is Llama 4 Maverick (free).',
  features: [
    {
      icon: <Zap className="h-4 w-4 text-emerald-600" />,
      text: 'Free models: No cost, rate-limited (50-1000 requests/day)',
    },
    {
      icon: <Crown className="h-4 w-4 text-purple-600" />,
      text: 'Paid models: Higher quality, faster, unlimited (bring your own API key)',
    },
    {
      icon: <Gauge className="h-4 w-4 text-blue-600" />,
      text: 'Auto mode: Automatically picks the best model for each task',
    },
  ],
  hint: 'Most users start with free models and upgrade to paid as needed.',
};

// ==================== MODEL-SPECIFIC GUIDANCE ====================

export const MODEL_GUIDANCE: Record<string, ModelGuidance> = {
  // FREE MODELS
  'meta-llama/llama-4-maverick:free': {
    title: 'Llama 4 Maverick (Free)',
    description:
      "Meta's latest open-source model with 128 experts. Best free option for most tasks.",
    icon: <Zap className="h-5 w-5 text-emerald-600" />,
    tips: [
      'High quality responses (5/5 rating)',
      '128k context window (handles long conversations)',
      'Fast response times',
      '50-1000 free requests per day on OpenRouter',
    ],
    useCases: [
      'General conversations',
      'Content creation',
      'Code assistance',
      'Research and analysis',
    ],
    tradeoffs: {
      pros: ['Completely free', 'No API key required', 'High quality outputs', 'Fast performance'],
      cons: ['Rate limited (50-1000 requests/day)', 'May have occasional downtime'],
    },
  },

  'groq/mixtral-8x7b': {
    title: 'Mixtral 8x7B',
    description: 'Fast, efficient model from Mistral AI via Groq. Excellent for quick tasks.',
    icon: <Gauge className="h-5 w-5 text-blue-600" />,
    tips: [
      'Extremely fast (instant responses)',
      'Good quality (4/5 rating)',
      'Free tier: 14,400 requests/day',
      'Great for rapid iterations',
    ],
    useCases: ['Quick questions', 'Brainstorming', 'Simple coding tasks', 'Fast prototyping'],
    tradeoffs: {
      pros: ['Lightning fast', 'Generous free tier', 'Low latency'],
      cons: ['Slightly lower quality than Llama 4', 'Smaller context window (32k)'],
    },
  },

  'google/gemini-2.0-flash': {
    title: 'Gemini 2.0 Flash',
    description: "Google's latest model with massive context window. Best for document analysis.",
    icon: <Brain className="h-5 w-5 text-indigo-600" />,
    tips: [
      '1M token context (analyze entire books)',
      'Vision support (can process images)',
      'Function calling support',
      'Instant speed',
    ],
    useCases: [
      'Large document analysis',
      'Research with multiple sources',
      'Image understanding',
      'Complex reasoning tasks',
    ],
    tradeoffs: {
      pros: [
        'Massive 1M context window',
        'Vision capabilities',
        'Very fast',
        'Free tier available',
      ],
      cons: ['Requires Google API key', 'Proprietary (closed source)'],
    },
  },

  // PAID MODELS
  'openai/gpt-4o': {
    title: 'GPT-4o',
    description: "OpenAI's flagship model. Highest quality for complex tasks. Requires API key.",
    icon: <Crown className="h-5 w-5 text-purple-600" />,
    tips: [
      'Best overall quality (5/5 rating)',
      'Vision and function calling',
      '$0.030 per message (~$5 per 1M tokens)',
      'Requires OpenAI API key (BYOK)',
    ],
    useCases: [
      'Complex reasoning',
      'Professional content',
      'Advanced coding',
      'Critical decisions',
    ],
    tradeoffs: {
      pros: ['Highest quality outputs', 'Most reliable', 'Best for complex tasks'],
      cons: ['Expensive ($0.03/message)', 'Requires API key', 'Medium speed'],
    },
  },

  'anthropic/claude-3.5-sonnet': {
    title: 'Claude 3.5 Sonnet',
    description: "Anthropic's best model. Exceptional reasoning and analysis. Requires API key.",
    icon: <Brain className="h-5 w-5 text-purple-600" />,
    tips: [
      'Exceptional reasoning (5/5 rating)',
      '200k context window',
      '$0.030 per message (~$3 per 1M tokens)',
      'Requires Anthropic API key (BYOK)',
    ],
    useCases: ['Deep analysis', 'Research and writing', 'Complex problem solving', 'Code review'],
    tradeoffs: {
      pros: ['Best reasoning ability', 'Huge 200k context', 'Careful and thorough'],
      cons: ['Expensive ($0.03/message)', 'Requires API key', 'Medium speed'],
    },
  },

  // AUTO MODE
  auto: {
    title: 'Auto (Best for task)',
    description: 'Automatically selects the optimal model based on your request.',
    icon: <Zap className="h-5 w-5 text-orange-600" />,
    tips: [
      'Analyzes your request',
      'Picks best model automatically',
      'Balances quality, speed, and cost',
      'Uses free models by default',
    ],
    useCases: [
      'Varied tasks',
      "Don't want to choose manually",
      'Optimize cost/performance',
      'General usage',
    ],
    tradeoffs: {
      pros: ['No manual selection needed', 'Always optimal choice', 'Saves money'],
      cons: ['Less control', 'May switch models mid-conversation'],
    },
  },
};

// ==================== RECOMMENDATIONS ====================

export const MODEL_RECOMMENDATIONS = {
  'getting-started': {
    modelId: 'meta-llama/llama-4-maverick:free',
    reason: 'Best free option with high quality',
    useCase: 'New users, general tasks',
  },
  'fast-iteration': {
    modelId: 'groq/mixtral-8x7b',
    reason: 'Lightning fast, great for rapid prototyping',
    useCase: 'Quick questions, brainstorming',
  },
  'document-analysis': {
    modelId: 'google/gemini-2.0-flash',
    reason: '1M context window handles entire documents',
    useCase: 'Analyzing PDFs, research papers',
  },
  'complex-reasoning': {
    modelId: 'anthropic/claude-3.5-sonnet',
    reason: 'Best reasoning and analysis (paid)',
    useCase: 'Complex problems, deep research',
  },
  'highest-quality': {
    modelId: 'openai/gpt-4o',
    reason: 'Best overall quality (paid)',
    useCase: 'Professional work, critical tasks',
  },
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Get guidance for a specific model
 */
export function getModelGuidance(modelId: string): ModelGuidance | null {
  return MODEL_GUIDANCE[modelId] || null;
}

/**
 * Get recommendation for a use case
 */
export function getRecommendationForUseCase(
  useCase: keyof typeof MODEL_RECOMMENDATIONS
): ModelRecommendation {
  return MODEL_RECOMMENDATIONS[useCase];
}

/**
 * Get all free models
 */
export function getFreeModels(): string[] {
  return Object.entries(MODEL_GUIDANCE)
    .filter(([_, guidance]) => guidance.title.includes('Free') || guidance.title.includes('free'))
    .map(([modelId]) => modelId);
}

/**
 * Get all paid models
 */
export function getPaidModels(): string[] {
  return Object.entries(MODEL_GUIDANCE)
    .filter(([_, guidance]) =>
      guidance.tips.some(tip => tip.includes('Requires') && tip.includes('API key'))
    )
    .map(([modelId]) => modelId);
}
