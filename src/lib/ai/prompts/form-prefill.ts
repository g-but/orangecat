/**
 * Form Prefill Prompt Templates
 *
 * AI prompts for generating form field values from natural language descriptions.
 */

import type { EntityType } from '@/config/entity-registry';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { DEFAULT_PREFILL_MODE, type PrefillMode } from '@/config/ai-prefill';
import { logger } from '@/utils/logger';

const BITCOIN_CONTEXT = `IMPORTANT CONTEXT:
- OrangeCat settles payments in Bitcoin/Lightning; fiat currencies are for pricing and display only
- Express Bitcoin amounts in BTC (e.g., 0.001 BTC) EVERYWHERE — in prices and in any title/description text. NEVER write "sats" or "satoshis"; rephrase to BTC even if the user's description used sats.
- Keep fiat prices in their original currency (CHF, USD, EUR, etc.)
- Price examples: "0.001 BTC", "CHF 50", "$25", "€100"`;

const OUTPUT_FORMAT = `OUTPUT FORMAT:
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

/**
 * System prompt for form prefill AI.
 *
 * The two modes are deliberately different instructions, not cosmetic wording.
 * In `refine` the user is editing values that already exist, so the model is
 * told to rewrite them — the `generate` rules ("only what you can extract",
 * "do not make up information") would make an instruction like "make the
 * description longer" impossible to satisfy.
 */
export function getSystemPrompt(
  entityType: EntityType,
  mode: PrefillMode = DEFAULT_PREFILL_MODE
): string {
  const meta = ENTITY_REGISTRY[entityType];
  const entityName = meta?.name || entityType;

  if (mode === 'refine') {
    return `You are a helpful assistant for OrangeCat, an AI-powered platform for economic activity.

The user has a ${entityName} listing form in front of them, already filled in. They will give you an instruction describing how they want it changed. Your task is to APPLY that instruction and return the new values.

${BITCOIN_CONTEXT}

RULES:
1. Only output valid JSON - no markdown, no explanations
2. Return ONLY the fields the instruction changes, each with its complete new value (not a diff, not a fragment)
3. You MUST overwrite existing values when the instruction asks for it — that is the entire point of the request. Never echo a field back unchanged.
4. Follow the instruction literally, including any request about language, length, tone or detail:
   - "longer"/"more detail" means substantially expand the text, not reword it
   - "shorter" means genuinely cut it down
   - If specific languages are named (e.g. English and German), include ALL of them in the same field value, each version clearly separated
5. Expanding text is expected to add plausible, concrete detail consistent with the values already in the form. Do not invent facts that contradict them (prices, dates, categories), and never change a field the instruction did not ask about.
6. Keep prices in the currency already set unless the instruction says otherwise — do not convert
7. Respect each field's stated constraints and length limits; where no limit is given, keep a description to a few short paragraphs at most
8. Include a "confidence" object with scores (0-1) for each field you return
9. If the instruction cannot be applied to any of the available fields, return an empty "data" object rather than guessing

${OUTPUT_FORMAT}`;
  }

  return `You are a helpful assistant for OrangeCat, an AI-powered platform for economic activity.

Your task is to extract structured data from a user's natural language description to help them create a ${entityName} listing.

${BITCOIN_CONTEXT}

RULES:
1. Only output valid JSON - no markdown, no explanations
2. Only include fields you can confidently extract from the description
3. Include a "confidence" object with scores (0-1) for each field
4. Do not make up information not in the description
5. For unclear values, omit them rather than guess
6. Keep prices in the currency the user mentioned — do not convert

${OUTPUT_FORMAT}`;
}

/**
 * Build the user prompt with field definitions and description
 */
export function getUserPrompt(
  entityType: EntityType,
  userInput: string,
  fieldsDescription: string,
  specialInstructions: string,
  existingData?: Record<string, unknown>,
  mode: PrefillMode = DEFAULT_PREFILL_MODE
): string {
  const meta = ENTITY_REGISTRY[entityType];
  const entityName = meta?.name || entityType;

  return mode === 'refine'
    ? buildRefinePrompt(entityName, userInput, fieldsDescription, specialInstructions, existingData)
    : buildGeneratePrompt(
        entityName,
        userInput,
        fieldsDescription,
        specialInstructions,
        existingData
      );
}

function buildGeneratePrompt(
  entityName: string,
  userDescription: string,
  fieldsDescription: string,
  specialInstructions: string,
  existingData?: Record<string, unknown>
): string {
  let prompt = `I want to create a ${entityName} listing.

Here's my description:
"${userDescription}"

Available fields for this ${entityName}:
${fieldsDescription}

${specialInstructions ? `Special instructions:\n${specialInstructions}\n` : ''}`;

  const filled = nonEmptyEntries(existingData, PRICE_FIELDS);
  if (filled.length > 0) {
    prompt += `\nPreserve these existing values (do not overwrite):
${JSON.stringify(Object.fromEntries(filled), null, 2)}\n`;
  }

  prompt += `
Extract the relevant field values from my description. Output ONLY valid JSON with "data" and "confidence" objects.`;

  return prompt;
}

function buildRefinePrompt(
  entityName: string,
  instruction: string,
  fieldsDescription: string,
  specialInstructions: string,
  existingData?: Record<string, unknown>
): string {
  // Every filled field is shown, prices included: in refine mode the current
  // values are context for the edit, never a set of values to protect.
  const current = nonEmptyEntries(existingData);

  return `I am editing my ${entityName} listing.

${
  current.length > 0
    ? `These are the values currently in the form:
${JSON.stringify(Object.fromEntries(current), null, 2)}`
    : 'The form is currently empty.'
}

This is what I want you to change:
"${instruction}"

Available fields for this ${entityName}:
${fieldsDescription}

${specialInstructions ? `Special instructions:\n${specialInstructions}\n` : ''}
Apply my instruction to the current values. Output ONLY valid JSON with "data" (every field you changed, each holding its complete new value) and "confidence" objects. Do not include fields my instruction did not ask you to change.`;
}

/**
 * Price and currency are always overridable in `generate` — if the user mentions
 * them in their description, the AI should pick them up rather than keeping
 * template defaults.
 */
const PRICE_FIELDS = new Set(['price', 'currency', 'hourly_rate', 'fixed_price']);

function nonEmptyEntries(
  data: Record<string, unknown> | undefined,
  exclude?: Set<string>
): [string, unknown][] {
  if (!data) {
    return [];
  }
  return Object.entries(data).filter(
    ([k, v]) => v !== '' && v !== null && v !== undefined && !exclude?.has(k)
  );
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

    // Coerce numeric fields — LLMs sometimes return numbers as strings.
    // No fields end in _sats anymore (BTC is canonical per CLAUDE.md);
    // pattern dropped in 2026-06-05 SATS sweep.
    const numericFieldPatterns = [
      /_btc$/,
      /_usd$/,
      /^price/,
      /^amount/,
      /^rate/,
      /^hourly_rate$/,
      /^fixed_price$/,
      /^duration/,
      /^inventory/,
      /^count/,
      /^quantity/,
      /^target_amount/,
      /^minimum_investment/,
      /^funding_goal/,
    ];
    const coercedData: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(parsed.data)) {
      if (typeof val === 'string' && numericFieldPatterns.some(p => p.test(key))) {
        const num = Number(val);
        coercedData[key] = isNaN(num) ? val : num;
      } else {
        coercedData[key] = val;
      }
    }

    return {
      data: coercedData,
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
        'I want to sell handmade ceramic mugs for CHF 45 each',
        'Digital download of my artwork collection, $15',
        'Vintage hardware wallets, limited stock of 5 units, 0.005 BTC each',
      ];
    case 'service':
      return [
        'Consulting sessions, CHF 150/hour',
        'Web development services starting at 0.01 BTC',
        'Lightning Network integration help, 2 hour minimum',
      ];
    case 'event':
      return [
        'Bitcoin meetup next Saturday at the local cafe',
        'Online workshop about Lightning Network, January 15th at 7pm',
        'Hackathon weekend event with 0.1 BTC prize pool',
      ];
    case 'project':
      return [
        'Building an open-source Bitcoin wallet app, goal of 0.5 BTC',
        'Documentary about Bitcoin adoption in Africa',
        'Community education program for local merchants',
      ];
    case 'cause':
      return [
        'Supporting Bitcoin education in underserved communities',
        'Funding for open-source development',
        'Help me replace my hardware wallet that was stolen',
      ];
    case 'loan':
      return [
        'Need CHF 5,000 for 3 months to expand my business',
        'Looking to refinance my existing loan at a better rate',
        'Small business loan for mining equipment, 0.1 BTC',
      ];
    case 'investment':
      return [
        'Seeking 0.5 BTC in equity investment for my app, revenue-share model',
        'Raising 1 BTC for solar farm expansion, 8% annual return',
        'Looking for seed funding 0.25 BTC minimum investment',
      ];
    case 'research':
      return [
        'Bitcoin adoption study in emerging markets, goal 0.5 BTC',
        'Computational biology research on protein folding, mixed methods',
        'Economic impact of decentralized finance on local communities',
      ];
    case 'wishlist':
      return [
        'Birthday wishlist for my 30th in June',
        'Wedding registry — we need kitchen essentials and a honeymoon fund',
        'Personal wishlist for books and electronics',
      ];
    default:
      return ['Describe what you want to create...'];
  }
}
