/**
 * Form Prefill Service
 *
 * Core service for AI-powered form prefill functionality.
 * Processes natural language descriptions and generates structured form data.
 */

import type { EntityType } from '@/config/entity-registry';
import { ENTITY_REGISTRY, isValidEntityType } from '@/config/entity-registry';
import type { AIPrefillResponse } from '@/components/create/types';
import {
  extractFieldDescriptions,
  formatFieldsForPrompt,
  getSpecialFieldInstructions,
} from './schema-to-prompt';
import { getSystemPrompt, getUserPrompt, parseAIResponse } from './prompts/form-prefill';

// Default model for form prefill (fast, good at JSON generation)
const DEFAULT_MODEL = 'meta-llama/llama-4-maverick:free';

/**
 * Configuration for the form prefill service
 */
export interface FormPrefillConfig {
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
  entityConfig: {
    fieldGroups: Array<{
      fields?: Array<{
        name: string;
        label: string;
        type: string;
        required?: boolean;
        hint?: string;
        placeholder?: string;
        options?: Array<{ value: string; label: string }>;
        min?: number;
        max?: number;
      }>;
    }>;
  },
  existingData?: Record<string, unknown>,
  config?: FormPrefillConfig
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
    const fieldDescriptions = extractFieldDescriptions(entityConfig as any);
    const fieldsPrompt = formatFieldsForPrompt(fieldDescriptions);
    const specialInstructions = getSpecialFieldInstructions(entityType as EntityType);

    // Build prompts
    const systemPrompt = getSystemPrompt(entityType as EntityType);
    const userPrompt = getUserPrompt(
      entityType as EntityType,
      description,
      fieldsPrompt,
      specialInstructions,
      existingData
    );

    // Get API key from config or environment
    const apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        data: {},
        confidence: {},
        error: 'AI provider not configured. Please set up an API key in settings.',
      };
    }

    // Make API request
    const model = config?.model || DEFAULT_MODEL;
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://orangecat.app',
        'X-Title': 'OrangeCat Form Prefill',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.replace('openrouter/', ''),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: config?.temperature ?? 0.3, // Lower temperature for more deterministic output
        max_tokens: config?.maxTokens ?? 1000,
        response_format: { type: 'json_object' }, // Request JSON output if supported
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
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

    // Merge with existing data (preserve user's input)
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
    console.error('Form prefill error:', error);
    return {
      success: false,
      data: {},
      confidence: {},
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Validate and sanitize the generated data against the entity schema
 */
export function sanitizeGeneratedData(
  data: Record<string, unknown>,
  entityType: EntityType,
  fieldConfigs: Array<{ name: string; type: string; options?: Array<{ value: string }> }>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const field of fieldConfigs) {
    const value = data[field.name];
    if (value === undefined || value === null) {
      continue;
    }

    // Type-specific sanitization
    switch (field.type) {
      case 'number':
      case 'currency':
        // Ensure numeric values
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (typeof num === 'number' && !isNaN(num)) {
          sanitized[field.name] = num;
        }
        break;

      case 'select':
      case 'radio':
        // Ensure value is one of the allowed options
        if (field.options) {
          const allowedValues = field.options.map(o => o.value);
          if (typeof value === 'string' && allowedValues.includes(value)) {
            sanitized[field.name] = value;
          }
        }
        break;

      case 'checkbox':
      case 'boolean':
        // Ensure boolean value
        sanitized[field.name] = Boolean(value);
        break;

      case 'tags':
        // Ensure array of strings
        if (Array.isArray(value)) {
          sanitized[field.name] = value.filter(v => typeof v === 'string');
        } else if (typeof value === 'string') {
          // Parse comma-separated string
          sanitized[field.name] = value
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        }
        break;

      case 'date':
        // Ensure valid date string
        if (typeof value === 'string') {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            sanitized[field.name] = value;
          }
        }
        break;

      default:
        // String values - basic sanitization
        if (typeof value === 'string') {
          sanitized[field.name] = value.trim();
        } else if (typeof value === 'number') {
          sanitized[field.name] = String(value);
        }
    }
  }

  return sanitized;
}

/**
 * Get a list of all fields that can be AI-generated for an entity type
 */
export function getGeneratableFields(entityType: EntityType): string[] {
  const meta = ENTITY_REGISTRY[entityType];
  if (!meta) {
    return [];
  }

  // Most fields can be AI-generated except for sensitive ones
  const excludedFields = [
    'bitcoin_address',
    'lightning_address',
    'api_key',
    'secret',
    'password',
    'token',
  ];

  // This would ideally come from the entity config
  // For now, return common fields
  return [
    'title',
    'description',
    'price',
    'category',
    'tags',
    'product_type',
    'event_type',
    'service_location_type',
  ];
}
