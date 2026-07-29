/**
 * User economic profile — the structured store of a user's latent economic value.
 *
 * The keystone of the economic agent (docs/specs/cat-economic-interviewer.md): a
 * typed home for what Cat learns by interviewing the user, so the offer engine,
 * gap-detection, and future matchmaking reason over a real model of the person
 * instead of two free-text fields. Read into Cat's context; written by the
 * interview/extraction layer.
 *
 * Every accessor degrades gracefully: if the table doesn't exist yet (migration
 * pending on the box) or a query fails, reads return null/empty and writes return
 * false — Cat keeps working, just without this signal.
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { looksLikeSelfDisclosure, type MemoryAiService } from './memory';

export interface EconomicSkill {
  name: string;
  level?: string;
  years?: number;
}
export interface EconomicAsset {
  name: string;
  type?: string;
}
export type EconomicGoalKind = 'earn' | 'fund' | 'learn' | 'connect' | 'build';
export interface EconomicGoal {
  text: string;
  kind?: EconomicGoalKind;
}

export interface EconomicProfile {
  skills: EconomicSkill[];
  assets: EconomicAsset[];
  goals: EconomicGoal[];
  constraints: string[];
  /** The richest signal: what people come to this person for. */
  askedFor: string[];
  motivation?: string | null;
  stage?: string | null;
}

const EMPTY: EconomicProfile = {
  skills: [],
  assets: [],
  goals: [],
  constraints: [],
  askedFor: [],
  motivation: null,
  stage: null,
};

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** True when the profile carries any latent-value signal at all. */
export function isEconomicProfileEmpty(p: EconomicProfile | null): boolean {
  if (!p) {
    return true;
  }
  return (
    p.skills.length === 0 &&
    p.assets.length === 0 &&
    p.goals.length === 0 &&
    p.constraints.length === 0 &&
    p.askedFor.length === 0 &&
    !p.motivation &&
    !p.stage
  );
}

/**
 * SSOT for the economic dimensions, in the order Cat should probe them — "what
 * people ask them for" first (the richest signal), motivation last. Both the gap
 * list and the completeness score derive from this, so they can never drift.
 */
const ECONOMIC_DIMENSIONS: ReadonlyArray<{
  label: string;
  filled: (p: EconomicProfile) => boolean;
}> = [
  { label: 'what people come to them for', filled: p => p.askedFor.length > 0 },
  { label: 'skills', filled: p => p.skills.length > 0 },
  { label: 'assets they own that could earn', filled: p => p.assets.length > 0 },
  { label: 'goals', filled: p => p.goals.length > 0 },
  { label: 'constraints (time, capital)', filled: p => p.constraints.length > 0 },
  { label: 'what they want from being here', filled: p => !!p.motivation },
];

/** The dimensions still unknown — drives the proactive interview. */
export function economicProfileGaps(p: EconomicProfile | null): string[] {
  if (!p) {
    return ECONOMIC_DIMENSIONS.map(d => d.label);
  }
  return ECONOMIC_DIMENSIONS.filter(d => !d.filled(p)).map(d => d.label);
}

/**
 * How complete the economic picture is, 0–100 (deterministic, even-weighted across
 * the dimensions). Tells Cat how hard to lean into discovery and lets it frame
 * progress for the user ("you're X% of the way to a full picture").
 */
export function economicCompleteness(p: EconomicProfile | null): number {
  if (!p) {
    return 0;
  }
  const filled = ECONOMIC_DIMENSIONS.filter(d => d.filled(p)).length;
  return Math.round((filled / ECONOMIC_DIMENSIONS.length) * 100);
}

// Skill phrases that describe a sellable ARTIFACT (a thing you make once and sell
// many times) rather than time-for-hire. Everything else defaults to a service.
const PRODUCT_SKILL_HINTS = [
  'ebook',
  'e-book',
  'template',
  'preset',
  'course',
  'guide',
  'pattern',
  'sample pack',
  'print',
  'poster',
  'sticker',
  'kit',
  'plugin',
  'font',
  'stock photo',
  'recipe',
  'beat',
  'album',
  'artwork',
  'worksheet',
  'planner',
  'mockup',
  'lut',
];

/**
 * The entity type a skill most naturally becomes: a sellable artifact → product,
 * otherwise a service (time/expertise for hire — the common case). Deterministic;
 * lets the growth nudge open the RIGHT prefilled form instead of always a service.
 */
export function suggestedEntityForSkill(skill: string): 'service' | 'product' {
  const s = skill.toLowerCase();
  return PRODUCT_SKILL_HINTS.some(h => s.includes(h)) ? 'product' : 'service';
}

export async function getEconomicProfile(
  supabase: AnySupabaseClient,
  userId: string
): Promise<EconomicProfile | null> {
  try {
    const { data, error } = await supabase
      .from(DATABASE_TABLES.USER_ECONOMIC_PROFILE)
      .select('skills, assets, goals, constraints, asked_for, motivation, stage')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      // A query error (vs. an absent row) means the economic layer is degraded —
      // e.g. the table migration is lagging on the box. Left silent, this starves
      // nudges/offers and looks identical to "user hasn't filled it in". Signal it.
      logger.warn(
        'getEconomicProfile query failed — economic context will be empty (migration lag?)',
        { error },
        'EconomicProfile'
      );
      return null;
    }
    if (!data) {
      return null;
    }
    const row = data as Record<string, unknown>;
    return {
      skills: asArray<EconomicSkill>(row.skills),
      assets: asArray<EconomicAsset>(row.assets),
      goals: asArray<EconomicGoal>(row.goals),
      constraints: asArray<string>(row.constraints),
      askedFor: asArray<string>(row.asked_for),
      motivation: (row.motivation as string | null) ?? null,
      stage: (row.stage as string | null) ?? null,
    };
  } catch (err) {
    logger.warn('getEconomicProfile failed', { err: String(err) }, 'EconomicProfile');
    return null;
  }
}

function dedupe<T>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const key = typeof it === 'string' ? it.toLowerCase().trim() : JSON.stringify(it);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}

/**
 * Merge-upsert: union the provided array dimensions onto what's stored (so an
 * interview round adds without clobbering), and overwrite scalars when provided.
 */
export async function saveEconomicProfile(
  supabase: AnySupabaseClient,
  userId: string,
  patch: Partial<EconomicProfile>
): Promise<boolean> {
  try {
    const current = (await getEconomicProfile(supabase, userId)) ?? EMPTY;
    const merged = {
      user_id: userId,
      skills: dedupe([...current.skills, ...(patch.skills ?? [])]),
      assets: dedupe([...current.assets, ...(patch.assets ?? [])]),
      goals: dedupe([...current.goals, ...(patch.goals ?? [])]),
      constraints: dedupe([...current.constraints, ...(patch.constraints ?? [])]),
      asked_for: dedupe([...current.askedFor, ...(patch.askedFor ?? [])]),
      motivation: patch.motivation !== undefined ? patch.motivation : current.motivation,
      stage: patch.stage !== undefined ? patch.stage : current.stage,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from(DATABASE_TABLES.USER_ECONOMIC_PROFILE)
      .upsert(merged, { onConflict: 'user_id' });
    if (error) {
      logger.warn('saveEconomicProfile upsert failed', { error }, 'EconomicProfile');
      return false;
    }
    return true;
  } catch (err) {
    logger.warn('saveEconomicProfile failed', { err: String(err) }, 'EconomicProfile');
    return false;
  }
}

/**
 * Normalize a loose object (LLM extraction or action params) into an EconomicProfile
 * patch: arrays accept plain strings or objects; scalars pass through when strings.
 * Returns null if nothing usable is present.
 */
export function normalizeEconomicPatch(
  o: Record<string, unknown>
): Partial<EconomicProfile> | null {
  const strs = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      : [];
  const skills: EconomicSkill[] = (Array.isArray(o.skills) ? o.skills : [])
    .map(s => (typeof s === 'string' ? { name: s } : (s as EconomicSkill)))
    .filter(
      (s): s is EconomicSkill => !!s && typeof s.name === 'string' && s.name.trim().length > 0
    );
  const assets: EconomicAsset[] = (Array.isArray(o.assets) ? o.assets : [])
    .map(a => (typeof a === 'string' ? { name: a } : (a as EconomicAsset)))
    .filter(
      (a): a is EconomicAsset => !!a && typeof a.name === 'string' && a.name.trim().length > 0
    );
  const goals: EconomicGoal[] = (Array.isArray(o.goals) ? o.goals : [])
    .map(g => (typeof g === 'string' ? { text: g } : (g as EconomicGoal)))
    .filter(
      (g): g is EconomicGoal => !!g && typeof g.text === 'string' && g.text.trim().length > 0
    );

  const patch: Partial<EconomicProfile> = {
    skills,
    assets,
    goals,
    constraints: strs(o.constraints),
    askedFor: strs(o.asked_for ?? o.askedFor),
    motivation: typeof o.motivation === 'string' && o.motivation.trim() ? o.motivation : undefined,
    stage: typeof o.stage === 'string' && o.stage.trim() ? o.stage : undefined,
  };
  const hasAny =
    skills.length > 0 ||
    assets.length > 0 ||
    goals.length > 0 ||
    (patch.constraints?.length ?? 0) > 0 ||
    (patch.askedFor?.length ?? 0) > 0 ||
    !!patch.motivation ||
    !!patch.stage;
  return hasAny ? patch : null;
}

const ECON_EXTRACTION_SYSTEM = `You extract a person's LATENT ECONOMIC VALUE from one chat exchange — only what they actually stated or clearly implied, never invented.

Pull, where present:
- skills: things they can do (names). Treat self-deprecation ("it's nothing", "just a hobby", "anyone can do that") as a real skill worth capturing.
- assets: things they OWN that could be rented or sold.
- goals: what they want; each {text, kind} where kind is earn | fund | learn | connect | build.
- constraints: limits like "only evenings", "no upfront capital".
- asked_for: what people come to them for.
- motivation: why they're here — earn | community | meaning | learn | unsure.
- stage: exploring | has-offers | scaling.

Rules: ground everything in THIS exchange; omit anything not stated; never infer demand, prices, or stats. Output ONLY a JSON object with those keys (arrays empty if none), nothing else. Example:
{"skills":["translation"],"assets":[],"goals":[{"text":"earn on the side","kind":"earn"}],"constraints":[],"asked_for":["writing clear emails"],"motivation":"earn","stage":null}`;

/**
 * Passive, deterministic economic extraction — runs after each self-disclosing turn
 * (the reliable path the chat model's save_economic_profile action can't guarantee).
 * One extraction call → merge-upsert into the store. Fire-and-forget; never throws.
 */
export async function extractAndStoreEconomicProfile(
  supabase: AnySupabaseClient,
  userId: string,
  userMessage: string,
  assistantMessage: string,
  aiService: MemoryAiService,
  model: string
): Promise<void> {
  if (!looksLikeSelfDisclosure(userMessage)) {
    return;
  }
  try {
    const { content } = await aiService.chatCompletion({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: ECON_EXTRACTION_SYSTEM },
        {
          role: 'user',
          content: `User said: "${userMessage}"\n\nAssistant replied: "${assistantMessage.slice(0, 800)}"\n\nExtract the user's economic profile as a JSON object.`,
        },
      ],
    });
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1 || end <= start) {
      return;
    }
    const parsed = JSON.parse(content.slice(start, end + 1)) as Record<string, unknown>;
    const patch = normalizeEconomicPatch(parsed);
    if (!patch) {
      return;
    }
    await saveEconomicProfile(supabase, userId, patch);
  } catch (err) {
    logger.warn('extractAndStoreEconomicProfile threw', { err: String(err) }, 'EconomicProfile');
  }
}
