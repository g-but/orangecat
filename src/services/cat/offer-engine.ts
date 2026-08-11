/**
 * Offer engine — the "What can I offer?" economic-agent capability.
 *
 * Given everything OrangeCat knows about a user (profile, documents, durable
 * memories, the entities they already have), reason over their LATENT economic
 * assets and propose several grounded, packaged ways to participate — each mapped
 * to the right entity type so it can prefill a create form (one-click "Create X").
 *
 * Slice 1 is packaging-led: it grounds offers in what the user HAS, and is
 * explicitly forbidden from inventing demand or stats (no fabricated personas —
 * see the earlier "Cat invented personas" bug). Live demand-signal grounding +
 * ranking is a later slice (docs/specs/economic-agent-capability.md).
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import type { EntityType } from '@/config/entity-registry';
import { PREFILLABLE_ENTITY_TYPES } from './tool-use-detection';
import { fetchFullContextForCat } from '@/services/ai/document-context';
import { buildFullContextString } from '@/services/ai/context-string-builder';
import { listMemories } from './memory';
import { getDemandSignals } from './demand-signals';
import { callPlatformJson } from './platform-llm';
import { logger } from '@/utils/logger';

const MAX_OFFERS = 5;

export interface ProposedOffer {
  entityType: EntityType;
  /** Full natural-language description — feeds generateFormPrefill. */
  description: string;
  /** Why this fits, grounded in a specific context item. */
  rationale: string;
}

const SYSTEM_PROMPT = `You are the economic agent inside OrangeCat — the user's own AI agent for turning who they are into ways to participate economically. Given everything OrangeCat knows about this user (profile, documents, durable memories, and the entities they already have), propose concrete, packaged ways they could earn, fund, lend, invest, or coordinate.

Map their LATENT ASSETS to the right OrangeCat entity type:
- a skill they can do for others → "service"
- something they make or produce → "product"
- a venture or goal that needs funding → "project"
- a physical thing to rent or sell → "asset"
- expertise or a study to fund → "research"
- capital to deploy → "investment" or "loan"
- a cause they care about → "cause"
- a community or audience → "circle"
- knowledge or an experience to host → "event"

RULES (these are hard constraints):
- Ground EVERY offer in something SPECIFIC from the provided context. In "rationale", name the concrete skill, asset, document, or experience it comes from.
- NEVER invent facts about the user. NEVER invent demand, market size, or statistics (e.g. "3 people searched for this"). The "PLATFORM LANDSCAPE" section is the ONLY demand/supply data you have — do not invent searches, trends, or numbers beyond it.
- Use the PLATFORM LANDSCAPE to make offers sharper: price in line with comparable active listings, prefer viable types, point out a GAP the user could fill ("no translation services exist on OrangeCat yet"), or differentiate where a niche is already crowded. When a landscape signal informs an offer, reference it in the rationale.
- Do NOT duplicate something they already offer (check their existing entities).
- Each "description" must be a full, publishable description (what it is, who it is for, a sensible scope) so it can prefill a create form — but do NOT fabricate a specific price; leave price out unless the context clearly implies one.
- Money is always Bitcoin (BTC) or a fiat currency. NEVER write "sats" or "satoshis" — say "BTC" (e.g. "0.0005 BTC", never "50,000 sats").
- Prefer VARIETY across the economic spectrum over several of the same type.
- Quality over quantity: if the context is thin, return fewer offers (or none). A weak, generic offer is worse than no offer.

Output ONLY JSON in this exact shape:
{"offers":[{"entityType":"service","description":"<full publishable description>","rationale":"Grounded in: <the specific context item>"}]}
entityType MUST be one of: ${PREFILLABLE_ENTITY_TYPES.join(', ')}.`;

/**
 * Reason over the user's full context and return up to `count` grounded offers.
 * Returns [] on any failure (missing keys, bad model output) — callers degrade
 * gracefully (Cat just answers without cards).
 */
export async function generateOffers(
  supabase: AnySupabaseClient,
  userId: string,
  opts?: { count?: number; focus?: string }
): Promise<ProposedOffer[]> {
  const count = Math.min(Math.max(opts?.count ?? 4, 1), MAX_OFFERS);

  const [context, memories, demandBlob] = await Promise.all([
    fetchFullContextForCat(supabase, userId),
    listMemories(supabase, userId),
    getDemandSignals(supabase),
  ]);
  const contextBlob = buildFullContextString(context);
  const memoryBlob = memories.length ? memories.map(m => `- ${m.content}`).join('\n') : '(none)';

  const userPrompt = `Everything OrangeCat knows about this user:

${contextBlob}

DURABLE MEMORIES:
${memoryBlob}

PLATFORM LANDSCAPE — what's already active on OrangeCat right now (real, the only demand/supply data you have):
${demandBlob || '(the platform is very early — few or no listings yet)'}
${opts?.focus ? `\nFocus the suggestions around: ${opts.focus}\n` : ''}
Propose up to ${count} grounded offers as JSON.`;

  // One platform-LLM path for every structured Cat feature (platform-llm.ts):
  // provider choice, json-mode fallback, and failure logging live there once.
  const raw = await callPlatformJson(SYSTEM_PROMPT, userPrompt, {
    temperature: 0.5,
    maxTokens: 1600,
  });
  if (!raw) {
    return [];
  }
  return parseOffers(raw, count);
}

function parseOffers(raw: string, count: number): ProposedOffer[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const arr: unknown[] = Array.isArray(parsed)
      ? parsed
      : ((parsed as { offers?: unknown[] })?.offers ?? []);
    const prefillable = PREFILLABLE_ENTITY_TYPES as readonly string[];
    return arr
      .filter(
        (o): o is { entityType: string; description: string; rationale?: string } =>
          !!o &&
          typeof (o as { entityType?: unknown }).entityType === 'string' &&
          typeof (o as { description?: unknown }).description === 'string' &&
          (o as { description: string }).description.trim().length >= 10
      )
      .filter(o => prefillable.includes(o.entityType))
      .slice(0, count)
      .map(o => ({
        entityType: o.entityType as EntityType,
        description: o.description.trim(),
        rationale: String(o.rationale ?? '').trim(),
      }));
  } catch {
    logger.warn('offer-engine: could not parse model output as JSON', {}, 'OfferEngine');
    return [];
  }
}
