import { buildCatSystemPrompt } from '@/services/cat/system-prompt';
import { getCatFewShotExamplesText } from '@/services/cat/few-shot-examples';
import { CAT_ACTIONS } from '@/config/cat-actions';
import { GROQ_ON_DEMAND_TPM_LIMIT, GROQ_CHAT_MAX_TOKENS } from '@/services/ai/groq';

/**
 * The prompt has a size budget, and it only ratchets DOWN.
 *
 * Nothing watched this number, so it grew every time an action or a section was
 * added — to 60,322 characters shipped on EVERY message, before a single byte
 * of the user's own context. The cost is not theoretical: it is why platform
 * Groq can never serve Cat.
 *
 * Groq's on-demand tier allows GROQ_ON_DEMAND_TPM_LIMIT tokens per minute, and
 * the reserved output counts against the same bucket, so the whole assembled
 * prompt must fit in (12000 - 2048) * 4 ≈ 39,808 characters. Cat's static
 * prompt alone is over that before any memories, profile, history or page
 * excerpt are appended — so `overflowsPlatformGroq` skips Groq pre-flight on
 * every request, and everything falls to OpenRouter's free tier, which is
 * capped at 50 requests/day across ALL users. That cap is what turned six real
 * users away in June 2026 (see failed-turn.ts).
 *
 * So this file is not style policing. The number is a product constraint.
 */

/** Whole-prompt ceiling for the on-demand Groq tier, derived — never hardcoded. */
const GROQ_PROMPT_CEILING_CHARS = (GROQ_ON_DEMAND_TPM_LIMIT - GROQ_CHAT_MAX_TOKENS) * 4;

/**
 * Current high-water mark. RATCHET: lower it when the prompt shrinks; do not
 * raise it to make a failing build pass. Growing the prompt spends capacity
 * that real users need, so it has to be a conscious, argued decision — which is
 * exactly what was missing while it grew to 60k.
 */
const PROMPT_BUDGET_CHARS = 60_500;

function assembledStaticPrompt(): string {
  // Mirrors chat-orchestrator: system prompt + few-shot examples. User context,
  // history and the message itself are added on top of this at request time.
  return `${buildCatSystemPrompt({})}\n\n${getCatFewShotExamplesText()}`;
}

describe('Cat prompt size', () => {
  it('does not grow past its budget', () => {
    const chars = assembledStaticPrompt().length;
    expect(chars).toBeLessThanOrEqual(PROMPT_BUDGET_CHARS);
  });

  it('reports how far it still is from being servable by platform Groq', () => {
    const chars = assembledStaticPrompt().length;
    const overshoot = chars - GROQ_PROMPT_CEILING_CHARS;
    // Not an assertion about passing today — a standing, visible measurement of
    // the gap, so shrinking work has a target instead of a vague "make it
    // smaller". When this goes negative the static prompt fits, and the real
    // goal is lower still: user context must fit in the same budget.
    // eslint-disable-next-line no-console
    console.info(
      `[cat prompt] ${chars} chars · Groq ceiling ${GROQ_PROMPT_CEILING_CHARS} · overshoot ${overshoot}`
    );
    expect(GROQ_PROMPT_CEILING_CHARS).toBeGreaterThan(0);
  });
});

describe('every action stays reachable', () => {
  // The prompt IS the routing table. An enabled action that appears nowhere in
  // it cannot be chosen, no matter how correct its handler is — that is how
  // publish_interest lost to update_profile (see action-disambiguation.test.ts).
  //
  // This matters most for future shrinking work: the tempting way to cut the
  // prompt is to include only the actions that look relevant to the turn, and
  // this is the invariant that must survive it.
  const enabled = Object.values(CAT_ACTIONS).filter(a => a.enabled);

  it('documents at least one action (guards against an empty registry)', () => {
    expect(enabled.length).toBeGreaterThan(10);
  });

  /**
   * Deliberately NOT `toContain(id)`. An id gets mentioned in passing all over
   * the prompt ("publish_entity and archive_entity require confirmation"), so a
   * bare substring match passes even when the action has no usable
   * documentation at all — it was silently vacuous until a mutation test caught
   * it. An action is only reachable in a form the model can emit:
   *   - a catalog line `**id(params)**`, or
   *   - a worked example containing `"actionId": "id"`.
   */
  function isDocumentedActionably(prompt: string, id: string): boolean {
    return prompt.includes(`**${id}(`) || prompt.includes(`"actionId": "${id}"`);
  }

  it.each(enabled.map(a => a.id))('%s is documented in an emittable form', id => {
    expect(isDocumentedActionably(assembledStaticPrompt(), id)).toBe(true);
  });
});
