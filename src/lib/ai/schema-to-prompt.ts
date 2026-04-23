/**
 * Schema to Prompt Utilities
 *
 * Converts Zod schemas and entity configurations to human-readable
 * field descriptions for AI prompts.
 */

import type { EntityType } from '@/config/entity-registry';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import type { FieldConfig, EntityConfig } from '@/components/create/types';

/**
 * Field description for AI prompt
 */
export interface FieldDescription {
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
export function fieldConfigToDescription(field: FieldConfig): FieldDescription {
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
export function extractFieldDescriptions(config: EntityConfig): FieldDescription[] {
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
 * Get entity context for the AI prompt
 */
export function getEntityContext(entityType: EntityType): string {
  const meta = ENTITY_REGISTRY[entityType];

  if (!meta) {
    return `Creating a ${entityType}`;
  }

  return `Creating a ${meta.name} - ${meta.description}`;
}

/**
 * Get list of required fields from an entity config
 */
export function getRequiredFields(config: EntityConfig): string[] {
  const required: string[] = [];

  for (const group of config.fieldGroups) {
    if (group.fields) {
      for (const field of group.fields) {
        if (field.required) {
          required.push(field.name);
        }
      }
    }
  }

  return required;
}

/**
 * Get common field names that typically need special handling
 */
export function getSpecialFieldInstructions(entityType: EntityType): string {
  const instructions: string[] = [];

  // Bitcoin-specific instructions
  instructions.push(
    'For Bitcoin prices: Express amounts in BTC as decimal values (e.g., 0.001 BTC). Never use satoshis. Common price points: 0.00005 BTC (~$5), 0.0003 BTC (~$30), 0.001 BTC (~$100).'
  );

  // Entity-specific instructions
  switch (entityType) {
    case 'product':
      instructions.push(
        'For product_type: Choose "physical" for tangible goods, "digital" for downloads/files, or "service" for service-based products.'
      );
      instructions.push(
        'For inventory_count: Use -1 for unlimited inventory, or a positive number for limited stock.'
      );
      break;
    case 'service':
      instructions.push(
        'For services: Provide either hourly_rate OR fixed_price (or both). Duration is in minutes.'
      );
      break;
    case 'event':
      instructions.push('For events: start_date is required. Use ISO format (YYYY-MM-DDTHH:mm).');
      break;
    case 'loan':
      instructions.push(
        'For loans: original_amount is what you need to borrow in BTC. Interest rates are annual percentages (e.g., 5 for 5%).'
      );
      break;
    case 'investment':
      instructions.push(
        'For investments: target_amount is the total raise goal in BTC. minimum_investment is the minimum ticket size in BTC.'
      );
      break;
    case 'research':
      instructions.push(
        'For research: funding_goal_btc is the target in BTC. field must be one of: computer_science, biology, artificial_intelligence, economics, other.'
      );
      break;
    case 'wishlist':
      instructions.push(
        'For wishlists: type must be one of: general, birthday, wedding, baby_shower, graduation, personal. visibility: public, unlisted, or private.'
      );
      break;
  }

  return instructions.join('\n');
}
