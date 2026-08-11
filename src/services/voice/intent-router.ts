/**
 * One spoken sentence → the thing the person meant to create.
 *
 * Typing a listing means choosing a form first: you have to know that the bike
 * in your garage is an "asset" and the lesson you'd give is a "service" before
 * you can begin. Speaking doesn't work that way — people say "I want to sell my
 * old road bike for 200 francs" and expect the software to keep up. This is the
 * piece that keeps up: it reads one utterance and answers which entity it is,
 * so everything downstream (generateFormPrefill → a prefilled create form)
 * already works unchanged.
 *
 * Deliberately narrow, and NOT the offer engine. The offer engine reasons over
 * everything we know about someone to propose things they *could* do. This
 * answers a much smaller question about a single sentence they just said, and
 * inventing extra offers here would put words in their mouth.
 *
 * It answers `null` rather than guessing. Dropping someone into the wrong form
 * is worse than asking — they have to notice the mistake, back out, and start
 * over, and the whole point was to save them that.
 */

import { ENTITY_REGISTRY, type EntityType } from '@/config/entity-registry';
import { PREFILLABLE_ENTITY_TYPES } from '@/services/cat/tool-use-detection';
import { AI_ASSIST_MIN_INPUT_LENGTH } from '@/config/ai-form-assist';
import { callPlatformJson } from '@/services/cat/platform-llm';

/**
 * Below this we ask instead of routing.
 *
 * Chosen to be unforgiving: the cost of a wrong route is a person landing in a
 * form for something they never meant to make, which reads as the software not
 * listening. The cost of asking is one tap.
 */
export const MIN_ROUTE_CONFIDENCE = 0.6;

/**
 * Long enough to carry an intent — below this there is nothing to route.
 *
 * Tied to the prefill floor rather than picked separately: anything short
 * enough to be refused there would route to a create form and then silently
 * fail to fill it, stranding the user on their own words with no explanation.
 */
const MIN_TRANSCRIPT_LENGTH = AI_ASSIST_MIN_INPUT_LENGTH.fill;
const MAX_TRANSCRIPT_LENGTH = 4000;

export interface VoiceIntent {
  entityType: EntityType;
  /** What to hand generateFormPrefill — the person's own words, cleaned up. */
  description: string;
  /** 0..1. Below MIN_ROUTE_CONFIDENCE the caller must ask, not assume. */
  confidence: number;
}

/**
 * The menu, built from the registry so entity semantics live in exactly one
 * place. Adding an entity type teaches this router about it for free.
 */
function buildEntityMenu(): string {
  return PREFILLABLE_ENTITY_TYPES.map(type => {
    const meta = ENTITY_REGISTRY[type as EntityType];
    return `- "${type}": ${meta.description}${meta.createActionLabel ? ` (${meta.createActionLabel})` : ''}`;
  }).join('\n');
}

const SYSTEM_PROMPT = `You classify ONE spoken sentence from a user of OrangeCat into the single thing they want to create.

Answer ONLY with JSON:
{"entityType":"<type>","description":"<their intent, cleaned up>","confidence":<0..1>}

entityType MUST be exactly one of:
${buildEntityMenu()}

Rules:
- Pick the ONE type the sentence is actually about. Do not propose alternatives.
- "description" is THEIR words, lightly cleaned (drop filler, fix obvious dictation errors, keep every concrete detail: names, amounts, currencies, condition, dates). Never invent details they did not say. Never add marketing language.
- Keep amounts and currencies exactly as spoken ("200 francs" stays 200 CHF, not "around 200").
- confidence reflects how clearly the sentence names one creatable thing. A vague sentence ("I need to sort my finances") is LOW confidence, not a guess at "project".
- If it is not a request to create something at all — a question, a greeting, a note to self — use confidence 0.`;

/**
 * Validate the model's answer rather than trust it.
 *
 * A hallucinated entity type would route someone to a create path that does not
 * exist, so the type is checked against the registry-derived list, not merely
 * parsed.
 */
function parseIntent(raw: string, fallbackDescription: string): VoiceIntent | null {
  try {
    const parsed = JSON.parse(raw) as {
      entityType?: unknown;
      description?: unknown;
      confidence?: unknown;
    };

    const type = typeof parsed.entityType === 'string' ? parsed.entityType : '';
    if (!(PREFILLABLE_ENTITY_TYPES as readonly string[]).includes(type)) {
      return null;
    }

    const confidence =
      typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0;

    // A model that drops the description still gave us a usable route: the raw
    // transcript is the person's words, which is what the description is for.
    const description =
      typeof parsed.description === 'string' && parsed.description.trim().length > 0
        ? parsed.description.trim()
        : fallbackDescription;

    return { entityType: type as EntityType, description, confidence };
  } catch {
    return null;
  }
}

/**
 * Route one transcript, or answer null.
 *
 * Null covers every "we don't know": no key, model failure, unparseable answer,
 * an entity type that isn't real, or a sentence that wasn't asking to create
 * anything. The caller shows the transcript and asks — it never picks for them.
 */
export async function routeVoiceIntent(transcript: string): Promise<VoiceIntent | null> {
  const text = transcript.trim().slice(0, MAX_TRANSCRIPT_LENGTH);
  if (text.length < MIN_TRANSCRIPT_LENGTH) {
    return null;
  }

  // One platform-LLM path for every structured Cat feature (platform-llm.ts):
  // provider choice, json-mode fallback, and failure logging live there once.
  // Classification, not composition — near-deterministic on purpose so the
  // same sentence doesn't land in a different form on a second try.
  const raw = await callPlatformJson(SYSTEM_PROMPT, text, {
    temperature: 0.1,
    maxTokens: 400,
    timeoutMs: 15_000,
  });
  if (!raw) {
    return null;
  }

  const intent = parseIntent(raw, text);
  if (!intent || intent.confidence < MIN_ROUTE_CONFIDENCE) {
    return null;
  }
  return intent;
}
