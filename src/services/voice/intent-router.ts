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

import { PROVIDER_BASE_URLS } from '@/config/ai-provider-runtime';
import { DEFAULT_FREE_MODEL_ID } from '@/config/ai-models';
import { ENTITY_REGISTRY, type EntityType } from '@/config/entity-registry';
import { PREFILLABLE_ENTITY_TYPES } from '@/services/cat/tool-use-detection';
import { logger } from '@/utils/logger';

/** Mirrors offer-engine / form-prefill-service: capable and reliable at JSON. */
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const OPENROUTER_MODEL = DEFAULT_FREE_MODEL_ID;

/**
 * Below this we ask instead of routing.
 *
 * Chosen to be unforgiving: the cost of a wrong route is a person landing in a
 * form for something they never meant to make, which reads as the software not
 * listening. The cost of asking is one tap.
 */
export const MIN_ROUTE_CONFIDENCE = 0.6;

/** Long enough to carry an intent — below this there is nothing to route. */
const MIN_TRANSCRIPT_LENGTH = 8;
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
- Ownership separates the types that otherwise look alike. If they KEEP the thing and let someone use it for a while — rent, let, lease, hire out — that is "asset". If ownership changes hands for money, that is "product". ("Rent out my flat" is an asset; "sell my bike" is a product.)
- "description" is THEIR words, lightly cleaned (drop filler, fix obvious dictation errors, keep every concrete detail: names, amounts, currencies, condition, dates). Never invent details they did not say. Never add marketing language.
- Keep amounts and currencies exactly as spoken ("200 francs" stays 200 CHF, not "around 200").
- confidence reflects how clearly the sentence names one creatable thing. A vague sentence ("I need to sort my finances") is LOW confidence, not a guess at "project".
- If it is not a request to create something at all — a question, a greeting, a note to self — use confidence 0.`;

function providerCall(): { url: string; model: string; headers: Record<string, string> } | null {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const useGroq = !!groqKey;
  const apiKey = useGroq ? groqKey : openRouterKey;
  if (!apiKey) {
    logger.warn('voice-intent: no platform AI key configured', {}, 'VoiceIntent');
    return null;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (!useGroq) {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'https://orangecat.ch';
  }

  return {
    url: useGroq
      ? `${PROVIDER_BASE_URLS.groq}/chat/completions`
      : `${PROVIDER_BASE_URLS.openrouter}/chat/completions`,
    model: useGroq ? GROQ_MODEL : OPENROUTER_MODEL,
    headers,
  };
}

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

  const provider = providerCall();
  if (!provider) {
    return null;
  }

  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: provider.headers,
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        // Classification, not composition — near-deterministic on purpose so the
        // same sentence doesn't land in a different form on a second try.
        temperature: 0.1,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      logger.warn('voice-intent: model call failed', { status: response.status }, 'VoiceIntent');
      return null;
    }

    const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content;
    if (!raw) {
      return null;
    }

    const intent = parseIntent(raw, text);
    if (!intent || intent.confidence < MIN_ROUTE_CONFIDENCE) {
      return null;
    }
    return intent;
  } catch (error) {
    logger.warn('voice-intent: model call threw', { error: String(error) }, 'VoiceIntent');
    return null;
  }
}
