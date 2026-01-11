/**
 * AI Auto Router
 *
 * Intelligently selects the optimal model based on:
 * - Task complexity
 * - Cost optimization
 * - Model availability
 * - Creator preferences
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 */

import {
  AI_MODEL_REGISTRY,
  ModelTier,
  AIModelMetadata,
  getModelsByTier,
  getAvailableModels,
  DEFAULT_MODEL_ID,
  DEFAULT_BTC_PRICE_USD,
} from '@/config/ai-models';

// ==================== TYPES ====================

export interface RoutingParams {
  /** The user's message */
  message: string;
  /** Previous messages in the conversation */
  conversationHistory?: Array<{ role: string; content: string }>;
  /** List of allowed model IDs (empty = all) */
  allowedModels?: string[];
  /** Preferred tier (overrides complexity analysis) */
  preferredTier?: ModelTier;
  /** Maximum cost per request in sats */
  maxCostSats?: number;
  /** Whether the task requires vision */
  requiresVision?: boolean;
  /** Whether the task requires function calling */
  requiresFunctionCalling?: boolean;
}

export interface RoutingResult {
  /** Selected model ID */
  model: string;
  /** Human-readable reason for selection */
  reason: string;
  /** Model tier */
  tier: ModelTier;
  /** Estimated cost in sats */
  estimatedCostSats: number;
  /** Complexity score (0-1) */
  complexityScore: number;
}

interface ComplexityAnalysis {
  /** Complexity score from 0 (simple) to 1 (complex) */
  score: number;
  /** Human-readable reason */
  reason: string;
  /** Estimated total tokens (input + output) */
  estimatedTokens: number;
  /** Detected task type */
  taskType: TaskType;
}

type TaskType =
  | 'simple_question'
  | 'coding'
  | 'analysis'
  | 'creative'
  | 'research'
  | 'conversation'
  | 'translation'
  | 'summarization'
  | 'complex_reasoning';

// ==================== COMPLEXITY KEYWORDS ====================

const COMPLEXITY_KEYWORDS: Record<string, { weight: number; taskType: TaskType }> = {
  // Coding keywords
  code: { weight: 0.2, taskType: 'coding' },
  programming: { weight: 0.2, taskType: 'coding' },
  debug: { weight: 0.25, taskType: 'coding' },
  algorithm: { weight: 0.3, taskType: 'coding' },
  refactor: { weight: 0.25, taskType: 'coding' },
  typescript: { weight: 0.2, taskType: 'coding' },
  javascript: { weight: 0.2, taskType: 'coding' },
  python: { weight: 0.2, taskType: 'coding' },
  function: { weight: 0.15, taskType: 'coding' },
  class: { weight: 0.15, taskType: 'coding' },

  // Analysis keywords
  analyze: { weight: 0.25, taskType: 'analysis' },
  compare: { weight: 0.2, taskType: 'analysis' },
  evaluate: { weight: 0.25, taskType: 'analysis' },
  assess: { weight: 0.2, taskType: 'analysis' },
  examine: { weight: 0.2, taskType: 'analysis' },

  // Research keywords
  research: { weight: 0.3, taskType: 'research' },
  thesis: { weight: 0.35, taskType: 'research' },
  academic: { weight: 0.3, taskType: 'research' },
  scientific: { weight: 0.3, taskType: 'research' },
  study: { weight: 0.2, taskType: 'research' },

  // Complex reasoning
  'step by step': { weight: 0.25, taskType: 'complex_reasoning' },
  'in detail': { weight: 0.2, taskType: 'complex_reasoning' },
  comprehensive: { weight: 0.25, taskType: 'complex_reasoning' },
  thorough: { weight: 0.2, taskType: 'complex_reasoning' },
  explain: { weight: 0.15, taskType: 'complex_reasoning' },

  // Creative keywords
  write: { weight: 0.15, taskType: 'creative' },
  story: { weight: 0.2, taskType: 'creative' },
  creative: { weight: 0.2, taskType: 'creative' },
  poem: { weight: 0.2, taskType: 'creative' },
  essay: { weight: 0.2, taskType: 'creative' },

  // Professional domains (higher complexity)
  legal: { weight: 0.35, taskType: 'complex_reasoning' },
  medical: { weight: 0.35, taskType: 'complex_reasoning' },
  financial: { weight: 0.3, taskType: 'analysis' },
  contract: { weight: 0.3, taskType: 'complex_reasoning' },

  // Translation
  translate: { weight: 0.15, taskType: 'translation' },
  translation: { weight: 0.15, taskType: 'translation' },

  // Summarization
  summarize: { weight: 0.1, taskType: 'summarization' },
  summary: { weight: 0.1, taskType: 'summarization' },
  tldr: { weight: 0.1, taskType: 'summarization' },
};

// ==================== AUTO ROUTER CLASS ====================

export class AIAutoRouter {
  private btcPriceUsd: number;

  constructor(btcPriceUsd: number = DEFAULT_BTC_PRICE_USD) {
    this.btcPriceUsd = btcPriceUsd;
  }

  /**
   * Select optimal model for the given request
   */
  selectModel(params: RoutingParams): RoutingResult {
    const {
      message,
      conversationHistory = [],
      allowedModels,
      preferredTier,
      maxCostSats,
      requiresVision,
      requiresFunctionCalling,
    } = params;

    // Analyze message complexity
    const complexity = this.analyzeComplexity(message, conversationHistory);

    // Determine target tier based on complexity or preference
    let targetTier: ModelTier;
    if (preferredTier) {
      targetTier = preferredTier;
    } else if (complexity.score < 0.3) {
      targetTier = 'economy';
    } else if (complexity.score < 0.7) {
      targetTier = 'standard';
    } else {
      targetTier = 'premium';
    }

    // Get candidate models
    let candidates = this.getCandidates(targetTier, {
      allowedModels,
      requiresVision,
      requiresFunctionCalling,
    });

    // If no candidates in target tier, try other tiers
    if (candidates.length === 0) {
      candidates = this.getFallbackCandidates({
        allowedModels,
        requiresVision,
        requiresFunctionCalling,
      });
    }

    // Filter by max cost if specified
    if (maxCostSats !== undefined && maxCostSats > 0) {
      candidates = candidates.filter(m => {
        const estimatedCost = this.estimateCost(m, complexity.estimatedTokens);
        return estimatedCost <= maxCostSats;
      });
    }

    // Fallback if no candidates
    if (candidates.length === 0) {
      const fallback = AI_MODEL_REGISTRY[DEFAULT_MODEL_ID];
      return {
        model: fallback.id,
        reason: 'Fallback to default model (no matching candidates)',
        tier: fallback.tier,
        estimatedCostSats: this.estimateCost(fallback, complexity.estimatedTokens),
        complexityScore: complexity.score,
      };
    }

    // Select best candidate (prefer lower cost within tier)
    candidates.sort((a, b) => a.inputCostPer1M - b.inputCostPer1M);
    const selected = candidates[0];

    return {
      model: selected.id,
      reason: this.buildReason(complexity, selected),
      tier: selected.tier,
      estimatedCostSats: this.estimateCost(selected, complexity.estimatedTokens),
      complexityScore: complexity.score,
    };
  }

  /**
   * Analyze message complexity using heuristics
   */
  analyzeComplexity(
    message: string,
    history: Array<{ role: string; content: string }>
  ): ComplexityAnalysis {
    let score = 0;
    const reasons: string[] = [];
    let detectedTaskType: TaskType = 'conversation';
    const taskTypeCounts: Record<TaskType, number> = {
      simple_question: 0,
      coding: 0,
      analysis: 0,
      creative: 0,
      research: 0,
      conversation: 0,
      translation: 0,
      summarization: 0,
      complex_reasoning: 0,
    };

    const lowerMessage = message.toLowerCase();

    // Length-based complexity
    const messageLength = message.length;
    if (messageLength > 2000) {
      score += 0.3;
      reasons.push('Long input');
    } else if (messageLength > 500) {
      score += 0.15;
      reasons.push('Medium length input');
    }

    // Keyword-based complexity detection
    for (const [keyword, config] of Object.entries(COMPLEXITY_KEYWORDS)) {
      if (lowerMessage.includes(keyword)) {
        score += config.weight;
        taskTypeCounts[config.taskType]++;
      }
    }

    // Find dominant task type
    let maxCount = 0;
    for (const [taskType, count] of Object.entries(taskTypeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        detectedTaskType = taskType as TaskType;
      }
    }

    if (maxCount > 0) {
      reasons.push(`${detectedTaskType.replace('_', ' ')} detected`);
    }

    // Conversation length complexity
    const historyTokens = history.reduce((acc, m) => acc + m.content.length / 4, 0);
    if (historyTokens > 4000) {
      score += 0.2;
      reasons.push('Long conversation context');
    } else if (historyTokens > 1000) {
      score += 0.1;
    }

    // Question complexity (multiple questions)
    const questionMarks = (message.match(/\?/g) || []).length;
    if (questionMarks > 3) {
      score += 0.2;
      reasons.push('Multiple questions');
    } else if (questionMarks > 1) {
      score += 0.1;
    }

    // Code block detection
    const codeBlocks = (message.match(/```/g) || []).length / 2;
    if (codeBlocks > 0) {
      score += 0.15 * Math.min(codeBlocks, 3);
      if (codeBlocks > 0) {
        detectedTaskType = 'coding';
        reasons.push('Contains code');
      }
    }

    // Numbered list detection (often indicates multi-step tasks)
    const numberedItems = (message.match(/^\d+\./gm) || []).length;
    if (numberedItems > 3) {
      score += 0.15;
      reasons.push('Multi-step task');
    }

    // Clamp score between 0 and 1
    score = Math.min(1, Math.max(0, score));

    // Estimate total tokens (rough: 4 chars per token)
    const estimatedInputTokens = Math.ceil((message.length + historyTokens * 4) / 4);
    const estimatedOutputTokens = this.estimateOutputTokens(detectedTaskType, estimatedInputTokens);

    return {
      score,
      reason: reasons.length > 0 ? reasons.join(', ') : 'Simple task',
      estimatedTokens: estimatedInputTokens + estimatedOutputTokens,
      taskType: detectedTaskType,
    };
  }

  /**
   * Update BTC price
   */
  setBtcPrice(priceUsd: number): void {
    this.btcPriceUsd = priceUsd;
  }

  // ==================== PRIVATE METHODS ====================

  private getCandidates(
    tier: ModelTier,
    filters: {
      allowedModels?: string[];
      requiresVision?: boolean;
      requiresFunctionCalling?: boolean;
    }
  ): AIModelMetadata[] {
    let candidates = getModelsByTier(tier);

    // Filter by allowed models
    if (filters.allowedModels && filters.allowedModels.length > 0) {
      candidates = candidates.filter(m => filters.allowedModels!.includes(m.id));
    }

    // Filter by capabilities
    if (filters.requiresVision) {
      candidates = candidates.filter(m => m.capabilities.includes('vision'));
    }
    if (filters.requiresFunctionCalling) {
      candidates = candidates.filter(m => m.capabilities.includes('function_calling'));
    }

    return candidates;
  }

  private getFallbackCandidates(filters: {
    allowedModels?: string[];
    requiresVision?: boolean;
    requiresFunctionCalling?: boolean;
  }): AIModelMetadata[] {
    let candidates = getAvailableModels();

    if (filters.allowedModels && filters.allowedModels.length > 0) {
      candidates = candidates.filter(m => filters.allowedModels!.includes(m.id));
    }

    if (filters.requiresVision) {
      candidates = candidates.filter(m => m.capabilities.includes('vision'));
    }
    if (filters.requiresFunctionCalling) {
      candidates = candidates.filter(m => m.capabilities.includes('function_calling'));
    }

    return candidates;
  }

  private estimateCost(model: AIModelMetadata, estimatedTokens: number): number {
    const inputTokens = Math.ceil(estimatedTokens * 0.4);
    const outputTokens = Math.ceil(estimatedTokens * 0.6);

    const inputCostUsd = (inputTokens / 1_000_000) * model.inputCostPer1M;
    const outputCostUsd = (outputTokens / 1_000_000) * model.outputCostPer1M;
    const totalCostUsd = inputCostUsd + outputCostUsd;

    const satsPerUsd = 100_000_000 / this.btcPriceUsd;
    return Math.ceil(totalCostUsd * satsPerUsd);
  }

  private estimateOutputTokens(taskType: TaskType, inputTokens: number): number {
    // Different task types have different output patterns
    const multipliers: Record<TaskType, number> = {
      simple_question: 0.5,
      coding: 2.0,
      analysis: 1.5,
      creative: 2.0,
      research: 2.5,
      conversation: 0.8,
      translation: 1.0,
      summarization: 0.3,
      complex_reasoning: 1.5,
    };

    const multiplier = multipliers[taskType] || 1.0;
    const estimated = Math.ceil(inputTokens * multiplier);

    // Clamp to reasonable range
    return Math.min(Math.max(estimated, 100), 4000);
  }

  private buildReason(complexity: ComplexityAnalysis, model: AIModelMetadata): string {
    const parts: string[] = [];

    // Complexity description
    if (complexity.score < 0.3) {
      parts.push('Simple task');
    } else if (complexity.score < 0.7) {
      parts.push('Moderate complexity');
    } else {
      parts.push('Complex task');
    }

    // Task type
    if (complexity.taskType !== 'conversation') {
      parts.push(complexity.taskType.replace('_', ' '));
    }

    // Model selection reason
    parts.push(`→ ${model.name} (${model.tier})`);

    return parts.join(' ');
  }
}

// ==================== FACTORY FUNCTION ====================

/**
 * Create an Auto Router instance
 */
export function createAutoRouter(btcPriceUsd?: number): AIAutoRouter {
  return new AIAutoRouter(btcPriceUsd);
}
