/**
 * Schema to Prompt Utilities
 *
 * Converts Zod schemas and entity configurations to human-readable
 * field descriptions for AI prompts.
 */

import type { EntityType } from '@/config/entity-registry';
import { AI_ENTITY_INSTRUCTIONS, AI_UNIVERSAL_INSTRUCTIONS } from '@/config/ai-form-assist';
import type { FieldConfig, FieldGroup } from '@/components/create/types';

/**
 * Field description for AI prompt
 */
interface FieldDescription {
  name: string;
  type: string;
  description: string;
  required: boolean;
  constraints?: string[];
  examples?: string[];
}

/**
 * Convert a field config to a description for the AI
 */
function fieldConfigToDescription(field: FieldConfig): FieldDescription {
  const constraints: string[] = [];
  const examples: string[] = [];

  // Add type-specific constraints
  switch (field.type) {
    case 'text':
      constraints.push('string');
      break;
    case 'textarea':
      constraints.push('longer text (multi-line ok)');
      break;
    case 'number':
      constraints.push('number');
      if (field.min !== undefined) {
        constraints.push(`minimum: ${field.min}`);
      }
      if (field.max !== undefined) {
        constraints.push(`maximum: ${field.max}`);
      }
      break;
    case 'currency':
      constraints.push('positive decimal number (price in BTC or fiat currency units)');
      examples.push('0.001 (for 0.001 BTC)', '25.99 (for $25.99 or CHF 25.99)');
      break;
    case 'select':
    case 'radio':
      if (field.options) {
        const values = field.options.map(o => o.value).join(', ');
        constraints.push(`one of: ${values}`);
      }
      break;
    case 'checkbox':
    case 'boolean':
      constraints.push('boolean (true/false)');
      break;
    case 'date':
      constraints.push('ISO date string (YYYY-MM-DD)');
      examples.push('2024-12-25');
      break;
    case 'url':
      constraints.push('valid URL');
      examples.push('https://example.com');
      break;
    case 'email':
      constraints.push('valid email address');
      examples.push('user@example.com');
      break;
    case 'bitcoin_address':
      constraints.push('valid Bitcoin address (optional)');
      examples.push('bc1q...');
      break;
    case 'tags':
      constraints.push('array of strings (keywords)');
      examples.push('["bitcoin", "handmade", "vintage"]');
      break;
  }

  // Build description from label and hint
  let description = field.label;
  if (field.hint) {
    description += ` - ${field.hint}`;
  }
  if (field.placeholder) {
    examples.push(field.placeholder);
  }

  return {
    name: field.name,
    type: field.type,
    description,
    required: field.required ?? false,
    constraints: constraints.length > 0 ? constraints : undefined,
    examples: examples.length > 0 ? examples : undefined,
  };
}

/**
 * Extract field descriptions from an entity config
 */
export function extractFieldDescriptions(config: {
  fieldGroups: FieldGroup[];
}): FieldDescription[] {
  const descriptions: FieldDescription[] = [];

  for (const group of config.fieldGroups) {
    if (group.fields) {
      for (const field of group.fields) {
        descriptions.push(fieldConfigToDescription(field));
      }
    }
  }

  return descriptions;
}

/**
 * Format field descriptions as a prompt-friendly string
 */
export function formatFieldsForPrompt(descriptions: FieldDescription[]): string {
  const lines: string[] = [];

  for (const field of descriptions) {
    let line = `- ${field.name} (${field.type}`;
    if (field.required) {
      line += ', required';
    }
    line += `): ${field.description}`;

    if (field.constraints && field.constraints.length > 0) {
      line += `\n  Constraints: ${field.constraints.join('; ')}`;
    }

    if (field.examples && field.examples.length > 0) {
      line += `\n  Examples: ${field.examples.join(', ')}`;
    }

    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Per-entity rules the AI needs to fill this form correctly.
 *
 * The content lives in `@/config/ai-form-assist` (AI_ENTITY_INSTRUCTIONS) —
 * this is just the lookup, so adding an entity type never means adding a
 * branch here.
 */
export function getSpecialFieldInstructions(entityType: EntityType): string {
  return [...AI_UNIVERSAL_INSTRUCTIONS, ...(AI_ENTITY_INSTRUCTIONS[entityType] ?? [])].join('\n');
}
