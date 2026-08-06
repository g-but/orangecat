/**
 * CAT PROMPT SUGGESTIONS — the shape, and the one case we can't generate.
 *
 * The Cat proposes what the human should ask it. Those proposals are GENERATED
 * from the user's own state (src/services/cat/prompt-suggestions.ts) — there is
 * deliberately no list of prompt strings in this codebase, because a fixed list
 * says the same thing on day 1 and day 100 and therefore says nothing.
 *
 * The single exception is a user the Cat knows nothing about: zero data is zero
 * signal, so there is nothing to recommend and the only honest structure is a
 * fork of intent. Even that fork is DERIVED — one template applied to
 * ENTITY_REGISTRY in the registry's own create order — so adding an entity type
 * never means editing prompt copy.
 *
 * ── The contract that makes these readable ──────────────────────────────────
 * The list is ordered, and AT MOST the first item carries a `reason`. A reason
 * is the Cat's justification for putting that prompt first, drawn from the
 * user's real data ("Handmade Candles is still a draft"). So:
 *
 *   reason present on [0]  → that is a recommendation; render it as the lead.
 *   no reasons at all      → these are equal alternatives; render them equally.
 *
 * Four equally-weighted boxes with no stated reason is the thing this replaces:
 * it forces the reader to compare four options before they can start.
 */

import { getEntitiesByCategory } from '@/config/entity-registry';

export interface CatPromptSuggestion {
  /** Sent verbatim to the Cat when the user picks it. */
  prompt: string;
  /**
   * Why THIS is the recommended opener, grounded in the user's own data.
   * Only ever set on the lead item — see the contract above.
   */
  reason?: string;
}

/** How many starter options a brand-new user is offered. Three is a fork; six is a menu. */
const STARTER_COUNT = 3;

/**
 * The intent fork for a user with no data, derived from the entity registry.
 * `business` is the registry's own category for the things a person offers or
 * funds, already sorted by its `createPriority`, so this tracks the registry
 * rather than restating it.
 */
export function getStarterPrompts(): CatPromptSuggestion[] {
  return getEntitiesByCategory()
    .business.slice(0, STARTER_COUNT)
    .map(meta => ({ prompt: `Help me create my first ${meta.name.toLowerCase()}` }));
}

/**
 * Precomputed starter fork — safe as a module constant because it derives from
 * a static registry. Used as the client's initial state and as the server's
 * fallback for anonymous visitors and for errors.
 */
export const STARTER_PROMPTS: CatPromptSuggestion[] = getStarterPrompts();
