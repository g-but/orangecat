/**
 * Form Prefill Service
 *
 * Core service for AI-powered form prefill functionality.
 * Processes natural language descriptions and generates structured form data.
 */

import type { EntityType } from '@/config/entity-registry';
import { isValidEntityType } from '@/config/entity-registry';
import type { AIPrefillResponse, EntityConfig } from '@/components/create/types';
import { USER_OVERRIDABLE_FIELDS, type AiAssistIntent } from '@/config/ai-form-assist';
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

export interface FormPrefillRequest {
  /** Entity type being filled (validated against the registry) */
  entityType: string;
  /** What the user typed: a description to fill from, or a change to apply */
  description: string;
  /** Form definition — supplies the field list the AI may write to */
  entityConfig: EntityConfig;
  /** Current form values */
  existingData?: Record<string, unknown>;
  /** Fill an empty form, or revise the values already in it. Default `fill`. */
  intent?: AiAssistIntent;
  /** Provider/model overrides */
  config?: FormPrefillConfig;
}

/**
 * Decide the final form values, and report which fields actually changed.
 *
 * This is the SSOT for "who wins on conflict", and it is why refinement used
 * to silently do nothing: existing values unconditionally overwrote the AI's
 * output, so a request to rewrite a non-empty description could never take
 * effect.
 *
 * - `fill`   — the user's own input is protected; the AI only lands in gaps
 *   (plus the price/currency fields, which carry template defaults rather than
 *   user intent — see USER_OVERRIDABLE_FIELDS).
 * - `refine` — the AI wins for the fields it returns, since changing them is
 *   the entire request. Fields it omits keep their current values.
 */
export function mergePrefillResult(
  aiData: Record<string, unknown>,
  existingData: Record<string, unknown> | undefined,
  intent: AiAssistIntent
): { data: Record<string, unknown>; changedFields: string[] } {
  const existing = existingData ?? {};

  if (intent === 'refine') {
    const changedFields = Object.keys(aiData).filter(
      key => !valuesEqual(aiData[key], existing[key])
    );
    return { data: { ...existing, ...aiData }, changedFields };
  }

  const data: Record<string, unknown> = { ...aiData };
  for (const [key, value] of Object.entries(existing)) {
    const userProvided = value !== '' && value !== null && value !== undefined;
    if (userProvided && !USER_OVERRIDABLE_FIELDS.includes(key)) {
      data[key] = value;
    }
  }
  const changedFields = Object.keys(aiData).filter(key => !valuesEqual(data[key], existing[key]));
  return { data, changedFields };
}

/** Structural equality good enough for form values (scalars, arrays, plain objects). */
function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

/**
 * Server-side form prefill service
 *
 * This should be called from an API route, not directly from the client.
 */
export async function generateFormPrefill({
  entityType,
  description,
  entityConfig,
  existingData,
  intent = 'fill',
  config,
}: FormPrefillRequest): Promise<AIPrefillResponse> {
  // Validate entity type
  if (!isValidEntityType(entityType)) {
    return {
      success: false,
      data: {},
      confidence: {},
      error: `Invalid entity type: ${entityType}`,
    };
  }

  // Validate description
  if (!description || description.trim().length < 10) {
    return {
      success: false,
      data: {},
      confidence: {},
      error: 'Please provide a longer description (at least 10 characters)',
    };
  }

  try {
    // Extract field descriptions from the entity config
    const fieldDescriptions = extractFieldDescriptions(entityConfig);
    const fieldsPrompt = formatFieldsForPrompt(fieldDescriptions);
    const specialInstructions = getSpecialFieldInstructions(entityType as EntityType);

    // Build prompts
    const systemPrompt = getSystemPrompt(entityType as EntityType, intent);
    const userPrompt = getUserPrompt(
      entityType as EntityType,
      description,
      fieldsPrompt,
      specialInstructions,
      existingData,
      intent
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
        // Headroom for genuinely written descriptions (and bilingual ones) —
        // 1000 truncated the JSON mid-string on multi-field forms.
        max_tokens: config?.maxTokens ?? 2000,
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

    const { data, changedFields } = mergePrefillResult(parsed.data, existingData, intent);

    // Confidence is reported only for fields the AI actually changed — a
    // preserved value is the user's, not an AI guess, and marking it 1.0 made
    // the form highlight untouched fields as AI-generated.
    const confidence = Object.fromEntries(
      changedFields.map(field => [field, parsed.confidence[field] ?? 0.7])
    );

    return {
      success: true,
      data,
      changedFields,
      confidence,
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
