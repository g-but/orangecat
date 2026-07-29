/**
 * Form Prefill Service
 *
 * Core service for AI-powered form prefill functionality.
 * Processes natural language descriptions and generates structured form data.
 */

import type { EntityType } from '@/config/entity-registry';
import { isValidEntityType } from '@/config/entity-registry';
import {
  DEFAULT_PREFILL_MODE,
  PREFILL_MAX_TOKENS,
  PREFILL_MIN_INPUT_LENGTH,
  type PrefillMode,
} from '@/config/ai-prefill';
import type { AIPrefillResponse, EntityConfig } from '@/components/create/types';
import { logger } from '@/utils/logger';
import {
  extractFieldDescriptions,
  formatFieldsForPrompt,
  getSpecialFieldInstructions,
} from './schema-to-prompt';
import { getSystemPrompt, getUserPrompt, parseAIResponse } from './prompts/form-prefill';

// Default models for form prefill (fast, good at JSON generation)
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_OPENROUTER_MODEL = 'meta-llama/llama-4-maverick:free';

/**
 * Configuration for the form prefill service
 */
interface FormPrefillConfig {
  /** AI model to use */
  model?: string;
  /** API key for the provider (optional, uses env if not provided) */
  apiKey?: string;
  /** Maximum tokens for AI response */
  maxTokens?: number;
  /** Temperature for generation (lower = more deterministic) */
  temperature?: number;
}

/**
 * Server-side form prefill service
 *
 * This should be called from an API route, not directly from the client.
 */
export async function generateFormPrefill(
  entityType: string,
  description: string,
  entityConfig: EntityConfig,
  existingData?: Record<string, unknown>,
  config?: FormPrefillConfig,
  mode: PrefillMode = DEFAULT_PREFILL_MODE
): Promise<AIPrefillResponse> {
  // Validate entity type
  if (!isValidEntityType(entityType)) {
    return {
      success: false,
      data: {},
      confidence: {},
      error: `Invalid entity type: ${entityType}`,
    };
  }

  // Validate input length (a refinement instruction is legitimately short)
  const minLength = PREFILL_MIN_INPUT_LENGTH[mode];
  if (!description || description.trim().length < minLength) {
    return {
      success: false,
      data: {},
      confidence: {},
      error:
        mode === 'refine'
          ? `Please describe the change you want (at least ${minLength} characters)`
          : `Please provide a longer description (at least ${minLength} characters)`,
    };
  }

  try {
    // Extract field descriptions from the entity config
    const fieldDescriptions = extractFieldDescriptions(entityConfig);
    const fieldsPrompt = formatFieldsForPrompt(fieldDescriptions);
    const specialInstructions = getSpecialFieldInstructions(entityType as EntityType);

    // Build prompts
    const systemPrompt = getSystemPrompt(entityType as EntityType, mode);
    const userPrompt = getUserPrompt(
      entityType as EntityType,
      description,
      fieldsPrompt,
      specialInstructions,
      existingData,
      mode
    );

    // Determine provider: Groq first, OpenRouter fallback
    const groqKey = process.env.GROQ_API_KEY;
    const openRouterKey = config?.apiKey || process.env.OPENROUTER_API_KEY;

    const useGroq = !!groqKey;
    const apiKey = useGroq ? groqKey : openRouterKey;

    if (!apiKey) {
      return {
        success: false,
        data: {},
        confidence: {},
        error: 'AI provider not configured. Please set up an API key in settings.',
      };
    }

    const model = config?.model || (useGroq ? DEFAULT_GROQ_MODEL : DEFAULT_OPENROUTER_MODEL);
    const baseUrl = useGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';

    // Make API request
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    if (!useGroq) {
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'https://orangecat.ch';
      headers['X-Title'] = 'OrangeCat Form Prefill';
    }

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: useGroq ? model : model.replace('openrouter/', ''),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: config?.temperature ?? 0.3,
        max_tokens: config?.maxTokens ?? PREFILL_MAX_TOKENS,
        ...(useGroq ? {} : { response_format: { type: 'json_object' } }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('AI API error', { errorText }, 'AI');
      return {
        success: false,
        data: {},
        confidence: {},
        error: 'AI service temporarily unavailable. Please try again.',
      };
    }

    const result = await response.json();

    // Extract the AI response content
    const aiContent = result.choices?.[0]?.message?.content;
    if (!aiContent) {
      return {
        success: false,
        data: {},
        confidence: {},
        error: 'No response from AI. Please try again.',
      };
    }

    // Parse the AI response
    const parsed = parseAIResponse(aiContent);
    if (!parsed) {
      return {
        success: false,
        data: {},
        confidence: {},
        error: 'Could not parse AI response. Please try with a clearer description.',
      };
    }

    // In `refine` the user's instruction IS a request to change filled fields,
    // so the AI's values are returned untouched. Re-applying existingData here
    // (as generate does) silently reverted every edit — "make the description
    // longer" came back as the original description, with a success toast.
    if (mode === 'refine') {
      return {
        success: true,
        data: parsed.data,
        confidence: parsed.confidence,
      };
    }

    // In `generate` the user typed those values themselves; never clobber them.
    const mergedData = { ...parsed.data };
    if (existingData) {
      for (const [key, value] of Object.entries(existingData)) {
        if (value !== '' && value !== null && value !== undefined) {
          // User's existing data takes precedence
          mergedData[key] = value;
          // Mark preserved fields with high confidence
          parsed.confidence[key] = 1.0;
        }
      }
    }

    return {
      success: true,
      data: mergedData,
      confidence: parsed.confidence,
    };
  } catch (error) {
    logger.error('Form prefill error', error, 'AI');
    return {
      success: false,
      data: {},
      confidence: {},
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
