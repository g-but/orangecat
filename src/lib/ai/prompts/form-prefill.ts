/**
 * Form Prefill Prompt Templates
 *
 * AI prompts for generating form field values from natural language descriptions.
 */

import type { EntityType } from '@/config/entity-registry';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { logger } from '@/utils/logger';

/**
 * System prompt for form prefill AI
 */
export function getSystemPrompt(entityType: EntityType): string {
  const meta = ENTITY_REGISTRY[entityType];
  const entityName = meta?.name || entityType;

  return `You are a helpful assistant for OrangeCat, a Bitcoin-powered marketplace and community platform.

Your task is to extract structured data from a user's natural language description to help them create a ${entityName} listing.

IMPORTANT CONTEXT:
- OrangeCat uses Bitcoin/Lightning Network for payments
- All prices should be expressed in satoshis (sats) unless another currency is specified
- Common price conversions: 1 BTC = 100,000,000 sats, roughly 1 sat = $0.0005 at typical rates
- Price examples: "50k sats" = 50000, "100,000 sats" = 100000, "$25" might be around 50000 sats

RULES:
1. Only output valid JSON - no markdown, no explanations
2. Only include fields you can confidently extract from the description
3. Include a "confidence" object with scores (0-1) for each field
4. Do not make up information not in the description
5. For unclear values, omit them rather than guess
6. Parse natural language amounts: "50k" = 50000, "100,000" = 100000
7. If user mentions a price in dollars/fiat, convert to approximate sats

OUTPUT FORMAT:
{
  "data": {
    "field_name": "value",
    ...
  },
  "confidence": {
    "field_name": 0.95,
    ...
  }
}`;
}

/**
 * Build the user prompt with field definitions and description
 */
export function getUserPrompt(
  entityType: EntityType,
  userDescription: string,
  fieldsDescription: string,
  specialInstructions: string,
  existingData?: Record<string, unknown>
): string {
  const meta = ENTITY_REGISTRY[entityType];
  const entityName = meta?.name || entityType;

  let prompt = `I want to create a ${entityName} listing.

Here's my description:
"${userDescription}"

Available fields for this ${entityName}:
${fieldsDescription}

${specialInstructions ? `Special instructions:\n${specialInstructions}\n` : ''}`;

  if (existingData && Object.keys(existingData).length > 0) {
    // Filter out empty/default values
    const nonEmptyData = Object.entries(existingData).filter(
      ([_, v]) => v !== '' && v !== null && v !== undefined
    );
    if (nonEmptyData.length > 0) {
      prompt += `\nPreserve these existing values (do not overwrite):
${JSON.stringify(Object.fromEntries(nonEmptyData), null, 2)}\n`;
    }
  }

  prompt += `
Extract the relevant field values from my description. Output ONLY valid JSON with "data" and "confidence" objects.`;

  return prompt;
}

/**
 * Parse the AI response and extract data with confidence scores
 */
export function parseAIResponse(
  response: string
): { data: Record<string, unknown>; confidence: Record<string, number> } | null {
  try {
    // Try to extract JSON from the response
    // Sometimes AI might wrap it in markdown code blocks
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.data || typeof parsed.data !== 'object') {
      logger.error('AI response missing "data" object', undefined, 'AI');
      return null;
    }

    // Ensure confidence object exists
    const confidence = parsed.confidence || {};

    // Add default confidence for fields without explicit confidence
    for (const key of Object.keys(parsed.data)) {
      if (!(key in confidence)) {
        confidence[key] = 0.7; // Default confidence
      }
    }

    return {
      data: parsed.data,
      confidence,
    };
  } catch (error) {
    logger.error('Failed to parse AI response', error, 'AI');
    return null;
  }
}

/**
 * Get example descriptions for different entity types (for UI hints)
 */
export function getExampleDescriptions(entityType: EntityType): string[] {
  switch (entityType) {
    case 'product':
      return [
        'I want to sell handmade ceramic mugs for 50,000 sats each',
        'Digital download of my Bitcoin artwork collection, $15',
        'Vintage Bitcoin hardware wallets, limited stock of 5 units',
      ];
    case 'service':
      return [
        'Bitcoin consulting sessions, $100/hour',
        'Web development services starting at 500k sats',
        'Lightning Network integration help, 2 hour minimum',
      ];
    case 'event':
      return [
        'Bitcoin meetup next Saturday at the local cafe',
        'Online workshop about Lightning Network, January 15th at 7pm',
        'Hackathon weekend event with 1M sats prize pool',
      ];
    case 'project':
      return [
        'Building an open-source Bitcoin wallet app, goal of 5M sats',
        'Documentary about Bitcoin adoption in Africa',
        'Community education program for local merchants',
      ];
    case 'cause':
      return [
        'Supporting Bitcoin education in underserved communities',
        'Funding for open-source Bitcoin development',
        'Help me replace my hardware wallet that was stolen',
      ];
    case 'loan':
      return [
        'Need 500k sats for 3 months to expand my business',
        'Looking to refinance my existing loan at a better rate',
        'Small business loan for Bitcoin mining equipment',
      ];
    default:
      return ['Describe what you want to create...'];
  }
}
