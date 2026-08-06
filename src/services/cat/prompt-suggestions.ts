/**
 * PROMPT SUGGESTIONS — the Cat proposing what the human should ask it.
 *
 * The chat empty state used to show a fixed list of four prompts. A fixed list
 * is the same on day 1 and day 100, so after the first visit it carries no
 * information while still demanding four reads before you can start. Worse,
 * nothing in it pointed at anything the user owned, so nothing recommended
 * anything: it was four equal strangers.
 *
 * Here the prompts are GENERATED from the user's actual state, and ranked:
 *
 *   1. Gaps are detected deterministically from the user's own data, ordered by
 *      economic consequence (can't get paid > invisible draft > unsellable
 *      listing > no demand). Every one names a real object of theirs.
 *   2. The platform LLM (free pool, never Cat Credits) rewrites the top gap as
 *      a natural prompt and proposes alternatives. Its recommendation must
 *      quote something real from the state or it is dropped — the same
 *      grounding rule the nudge engine enforces.
 *   3. If the LLM is unavailable or ungrounded, the deterministic gaps ARE the
 *      answer. Cat is never left with nothing to say.
 *
 * Only the lead carries a `reason`; see the contract in @/config/cat-prompts.
 *
 * Freshness comes from the cache key, not a timer: results are keyed by a
 * fingerprint of the state they were derived from, so suggestions change
 * exactly when the user's reality changes and never merely because time passed.
 */

import { ENTITY_REGISTRY, type EntityType } from '@/config/entity-registry';
import { STARTER_PROMPTS, type CatPromptSuggestion } from '@/config/cat-prompts';
import { logger } from '@/utils/logger';
import { callPlatformJson, parseJsonLoose } from './platform-llm';
import type { EntitySummary, FullUserContext } from '@/services/ai/document-context-types';

/** Suggestions shown at once: one recommendation plus a short tail. */
const MAX_SUGGESTIONS = 4;
/** A prompt longer than this stops being a chip and becomes reading. */
const MAX_PROMPT_CHARS = 80;
/** A reason is one glanceable clause, not a paragraph. */
const MAX_REASON_CHARS = 110;
/** Chat opens should not wait on a slow free-pool model; gaps are ready anyway. */
const LLM_TIMEOUT_MS = 5000;
/** Entity titles are quoted into prompts; long ones are elided. */
const MAX_TITLE_CHARS = 35;

const truncate = (s: string, max: number): string =>
  s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;

/**
 * Returns true when the user has enough context for the Cat to say something
 * specific. Below this bar there is nothing to ground a recommendation in.
 */
export function hasRichContext(context: FullUserContext): boolean {
  return (
    !!(context.profile?.name || context.profile?.bio || context.profile?.background) ||
    context.entities.length > 0 ||
    context.documents.length > 0 ||
    context.tasks.length > 0 ||
    context.wallets.length > 0
  );
}

// ─── Deterministic gap detection ──────────────────────────────────────────────

const isDraft = (e: EntitySummary): boolean => e.status?.toLowerCase() === 'draft';

const registryFor = (e: EntitySummary) => ENTITY_REGISTRY[e.type as EntityType] as
  | (typeof ENTITY_REGISTRY)[EntityType]
  | undefined;

/** True when this entity type is bought at a price, so a missing price blocks a sale. */
const isPriced = (e: EntitySummary): boolean => registryFor(e)?.paymentPattern === 'fixed_price';

const canBePaid = (context: FullUserContext): boolean =>
  context.wallets.length > 0 ||
  !!context.paymentCapabilities?.hasNwcWallet ||
  !!context.paymentCapabilities?.lightningAddress;

/**
 * Gaps in the user's own data, most economically consequential first. Each one
 * names a real object, which is what lets it justify itself.
 */
export function detectGaps(context: FullUserContext): CatPromptSuggestion[] {
  const gaps: CatPromptSuggestion[] = [];
  const { entities } = context;

  // 1. Listed things nobody can pay for. Everything downstream is moot.
  if (entities.length > 0 && !canBePaid(context)) {
    gaps.push({
      prompt: 'How do I set up a way to get paid?',
      reason: `You have ${entities.length} listing${entities.length === 1 ? '' : 's'} but no way to receive money.`,
    });
  }

  // 2. Drafts are invisible — work already done that earns nothing.
  const draft = entities.find(isDraft);
  if (draft) {
    const title = truncate(draft.title, MAX_TITLE_CHARS);
    gaps.push({
      prompt: `What's missing before I publish "${title}"?`,
      reason: `"${title}" is still a draft, so nobody can find it.`,
    });
  }

  // 3. A live listing nobody can understand.
  const undescribed = entities.find(e => !isDraft(e) && !e.description?.trim());
  if (undescribed) {
    const title = truncate(undescribed.title, MAX_TITLE_CHARS);
    gaps.push({
      prompt: `Help me write a description for "${title}"`,
      reason: `"${title}" has no description, so nobody can tell what it is.`,
    });
  }

  // 4. A live listing nobody can buy.
  const unpriced = entities.find(e => !isDraft(e) && isPriced(e) && !e.price_btc);
  if (unpriced) {
    const title = truncate(unpriced.title, MAX_TITLE_CHARS);
    gaps.push({
      prompt: `What should I charge for "${title}"?`,
      reason: `"${title}" has no price, so it can't be bought.`,
    });
  }

  // 5. A profile nobody can trust.
  if (!context.profile?.bio?.trim()) {
    gaps.push({
      prompt: 'Help me write my profile bio',
      reason: 'Your profile has no bio — it is the first thing visitors read.',
    });
  }

  // 6. Everything is set up: the remaining lever is demand.
  const live = entities.find(e => !isDraft(e));
  if (live && canBePaid(context)) {
    const title = truncate(live.title, MAX_TITLE_CHARS);
    gaps.push({
      prompt: `Who on OrangeCat needs "${title}"?`,
      reason: `"${title}" is live and can take payment — the next lever is demand.`,
    });
  }

  return gaps;
}

// ─── State digest (what the model is allowed to reason about) ─────────────────

interface Digest {
  text: string;
  /** Real strings from the user's data; the lead prompt must quote one. */
  tokens: string[];
}

function buildDigest(context: FullUserContext): Digest {
  const lines: string[] = [];
  const tokens: string[] = [];

  if (context.profile?.name) {
    lines.push(`Name: ${context.profile.name}`);
  }
  if (context.profile?.bio) {
    lines.push(`Bio: ${truncate(context.profile.bio, 200)}`);
  }

  for (const e of context.entities.slice(0, 10)) {
    const meta = registryFor(e);
    const flags = [
      isDraft(e) ? 'DRAFT (not published)' : 'published',
      e.description?.trim() ? 'has description' : 'NO description',
      isPriced(e) ? (e.price_btc ? 'has price' : 'NO price') : null,
    ].filter(Boolean);
    lines.push(`${meta?.name ?? e.type}: "${e.title}" — ${flags.join(', ')}`);
    tokens.push(e.title);
  }

  for (const d of context.documents.slice(0, 5)) {
    lines.push(`Note (${d.document_type ?? 'other'}): "${d.title}"`);
    tokens.push(d.title);
  }

  for (const t of context.tasks.slice(0, 5)) {
    lines.push(`Task: "${t.title}" (${t.priority} priority)`);
    tokens.push(t.title);
  }

  lines.push(canBePaid(context) ? 'Can receive payment: yes' : 'Can receive payment: NO');

  return { text: lines.join('\n'), tokens };
}

// ─── LLM generation ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = [
  'You help a user of OrangeCat (a Bitcoin-native platform where people list',
  'products, services, projects and causes and get paid for them) decide what to',
  'ask their AI economic agent, called Cat.',
  '',
  'You do NOT answer the user. You write the messages the USER should send to Cat,',
  'in the user\'s own first-person voice.',
  '',
  'You are given that user\'s real state and the single most consequential gap in',
  'it. Return JSON exactly:',
  '{"recommended":{"prompt":"...","reason":"..."},"alternatives":["...","...","..."]}',
  '',
  'Rules:',
  '- "recommended" must address the stated top gap and must quote a real name from',
  '  the state in double quotes when the gap concerns a specific listing.',
  `- "prompt" is at most ${MAX_PROMPT_CHARS} characters, phrased as the user talking to Cat.`,
  `- "reason" is at most ${MAX_REASON_CHARS} characters and states the FACT from the state that`,
  '  makes this the top priority. It is a justification, never a sales pitch.',
  '- "alternatives" are 3 other useful things this specific user could ask, each',
  '  distinct from the recommendation and from each other.',
  '- Never invent listings, numbers, or people that are not in the state.',
  '- Output JSON only.',
].join('\n');

interface LlmShape {
  recommended?: { prompt?: unknown; reason?: unknown };
  alternatives?: unknown;
}

const cleanLine = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') {
    return null;
  }
  const s = v.replace(/\s+/g, ' ').trim();
  if (!s || s.length > max * 2 || /https?:\/\//i.test(s)) {
    return null;
  }
  return truncate(s, max);
};

/** The lead must quote something real, or it is not a recommendation. */
const isGrounded = (prompt: string, tokens: string[]): boolean => {
  const p = prompt.toLowerCase();
  return tokens.some(t => t.trim().length > 2 && p.includes(t.toLowerCase().slice(0, 20)));
};

async function generateWithLlm(
  digest: Digest,
  topGap: CatPromptSuggestion
): Promise<{ lead: CatPromptSuggestion; alternatives: string[] } | null> {
  const userPrompt = [
    "This user's state:",
    digest.text,
    '',
    `Most consequential gap: ${topGap.reason}`,
    `A plain phrasing of it: ${topGap.prompt}`,
  ].join('\n');

  const raw = await callPlatformJson(SYSTEM_PROMPT, userPrompt, {
    temperature: 0.7,
    maxTokens: 500,
    timeoutMs: LLM_TIMEOUT_MS,
  });
  const parsed = parseJsonLoose<LlmShape>(raw);
  if (!parsed) {
    return null;
  }

  const prompt = cleanLine(parsed.recommended?.prompt, MAX_PROMPT_CHARS);
  const reason = cleanLine(parsed.recommended?.reason, MAX_REASON_CHARS);
  if (!prompt || !reason) {
    return null;
  }

  // A recommendation about a specific listing that doesn't name it is the
  // "haircuts to a ceramicist" failure — drop the model's version and keep ours.
  const gapNamesEntity = topGap.reason?.includes('"') ?? false;
  if (gapNamesEntity && !isGrounded(prompt, digest.tokens)) {
    logger.warn(
      'prompt-suggestions: ungrounded LLM recommendation discarded',
      { prompt },
      'PromptSuggestions'
    );
    return null;
  }

  const alternatives = Array.isArray(parsed.alternatives)
    ? parsed.alternatives
        .map(a => cleanLine(a, MAX_PROMPT_CHARS))
        .filter((a): a is string => !!a)
    : [];

  return { lead: { prompt, reason }, alternatives };
}

// ─── Fingerprint cache ────────────────────────────────────────────────────────

/**
 * Process-local cache. Deliberately not a table: this is derived data with a
 * cheap recompute, and a cold process regenerating once is a better failure
 * mode than a schema to migrate. The KEY carries the state fingerprint, so a
 * stale entry is impossible — a changed listing is a different key.
 */
const cache = new Map<string, CatPromptSuggestion[]>();
const MAX_CACHE_ENTRIES = 500;

function fingerprint(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function remember(key: string, value: CatPromptSuggestion[]): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) {
      cache.delete(oldest);
    }
  }
  cache.set(key, value);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compose the ordered prompts for a user. Never throws and never returns empty:
 * the deterministic gaps stand in for the LLM, and the registry-derived starter
 * fork stands in for both.
 */
export async function generatePromptSuggestions(
  userId: string,
  context: FullUserContext
): Promise<CatPromptSuggestion[]> {
  if (!hasRichContext(context)) {
    return STARTER_PROMPTS;
  }

  const gaps = detectGaps(context);
  if (gaps.length === 0) {
    return STARTER_PROMPTS;
  }

  const digest = buildDigest(context);
  const key = `${userId}:${fingerprint(digest.text)}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  let lead = gaps[0];
  const tail: string[] = [];

  try {
    const llm = await generateWithLlm(digest, gaps[0]);
    if (llm) {
      lead = llm.lead;
      tail.push(...llm.alternatives);
    }
  } catch (error) {
    logger.warn('prompt-suggestions: generation failed', { error }, 'PromptSuggestions');
  }

  // Deterministic gaps back-fill the tail, so a terse model still yields a full set.
  tail.push(...gaps.slice(1).map(g => g.prompt));

  const seen = new Set([lead.prompt.toLowerCase()]);
  const suggestions: CatPromptSuggestion[] = [lead];
  for (const prompt of tail) {
    if (suggestions.length >= MAX_SUGGESTIONS) {
      break;
    }
    const dedupeKey = prompt.toLowerCase();
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      // Only the lead carries a reason — see the contract in @/config/cat-prompts.
      suggestions.push({ prompt });
    }
  }

  remember(key, suggestions);
  return suggestions;
}
