/**
 * Cat Memory Service
 *
 * Persistent, semantic memory for My Cat. Durable facts about a user
 * ("Prefers Lightning over on-chain", "Building FleetCrown") are extracted
 * from chat, embedded, and recalled by MEANING on later turns — so Cat keeps
 * context across sessions instead of re-deriving everything each time.
 *
 * Two paths, both best-effort and non-blocking (Cat never breaks if memory is
 * unavailable — missing table, no embeddings provider, or a failed LLM call all
 * degrade to "no memory this turn"):
 *   - recallMemories():       embed the current message → nearest stored facts
 *   - extractAndStoreMemories(): after a turn, distil new durable facts → store
 *
 * Reuses the platform's 1536-dim pgvector setup (see content_embeddings) via the
 * match_cat_memories RPC. Privacy: cat_memories is RLS-scoped to the owner, and
 * users can view/delete everything Cat remembers (Settings → AI).
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { DATABASE_TABLES } from '@/config/database-tables';
import { MEMORY_IMPORT_CATEGORIES } from '@/config/cat-memory-import';
import { embeddingsEnabled, embedText, embedTexts } from '@/services/ai/embeddings';
import { logger } from '@/utils/logger';

export interface CatMemory {
  id: string;
  content: string;
  /** Cosine similarity to the recall query (0–1), present only on recall. */
  similarity?: number;
  created_at: string;
}

/** How many memories to recall and inject per turn. */
const RECALL_COUNT = 6;
/** Relevance floor for recall — below this a memory isn't worth injecting. */
const RECALL_MIN_SIMILARITY = 0.3;
/** A candidate fact this close to an existing one is treated as already known. */
const DEDUP_SIMILARITY = 0.88;
/** Cap facts distilled from a single exchange — keeps extraction cheap + focused. */
const MAX_FACTS_PER_TURN = 3;
/** Soft cap per user; oldest beyond this are pruned on write. */
const MAX_MEMORIES_PER_USER = 300;
/** Trim any single fact to this length before storing. */
const MAX_FACT_CHARS = 240;

/** Minimal Ai service shape used for extraction (matches the chat provider). */
export interface MemoryAiService {
  chatCompletion(opts: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature: number;
  }): Promise<{ content: string }>;
}

// ─── Recall ───────────────────────────────────────────────────────────────────

/**
 * Recall the memories most relevant to the current message. Returns [] (never
 * throws) when embeddings are disabled, the query is empty, or anything fails.
 */
export async function recallMemories(
  supabase: AnySupabaseClient,
  userId: string,
  queryText: string
): Promise<CatMemory[]> {
  if (!embeddingsEnabled() || !queryText?.trim()) {
    return [];
  }
  try {
    const vec = await embedText(queryText);
    if (!vec) {
      return [];
    }
    const { data, error } = await supabase.rpc('match_cat_memories', {
      p_user_id: userId,
      // pgvector accepts its text format ("[0.1,0.2,…]") for the vector param.
      query_embedding: JSON.stringify(vec),
      match_count: RECALL_COUNT,
      min_similarity: RECALL_MIN_SIMILARITY,
    });
    if (error) {
      logger.warn('match_cat_memories RPC failed', { error }, 'CatMemory');
      return [];
    }
    return (data ?? []) as CatMemory[];
  } catch (err) {
    logger.warn('recallMemories threw', { err }, 'CatMemory');
    return [];
  }
}

// ─── Forgetting ─────────────────────────────────────────────────────────────

/** What a forget request actually did — the model reports THIS, never a guess. */
export interface ForgetResult {
  /** Contents of the memories that were deleted. */
  deleted: string[];
  /** Requested facts for which no stored memory matched. */
  notFound: string[];
}

/** Semantic floor for treating a stored memory as "the fact the user means". */
const FORGET_MATCH_SIMILARITY = 0.75;
/** Bound one forget call — the model should pass targeted facts, not essays. */
const MAX_FORGET_FACTS = 10;
/** Ignore degenerate fragments ("a", "is") that would text-match everything. */
const MIN_FORGET_FRAGMENT_CHARS = 4;

/**
 * Delete stored memories matching the given facts. Matching is deliberately
 * generous — the user says "photography doesn't apply to me", the stored row is
 * "Has photography skills, speaks French…" — so each fact matches by
 * case-insensitive containment in EITHER direction, plus semantic similarity
 * when embeddings are available. Deletion is scoped to the user's own rows.
 *
 * This is the ONLY write path Cat has to memory besides extraction; it returns
 * exactly what happened so the model can report truthfully.
 */
export async function forgetMemoriesMatching(
  supabase: AnySupabaseClient,
  userId: string,
  facts: string[]
): Promise<ForgetResult> {
  const wanted = facts
    .map(f => f.trim())
    .filter(f => f.length >= MIN_FORGET_FRAGMENT_CHARS)
    .slice(0, MAX_FORGET_FACTS);
  const result: ForgetResult = { deleted: [], notFound: [] };
  if (wanted.length === 0) {
    return result;
  }

  const { data: rows, error: loadError } = await supabase
    .from(DATABASE_TABLES.CAT_MEMORIES)
    .select('id, content')
    .eq('user_id', userId);
  if (loadError) {
    logger.warn('forgetMemoriesMatching load failed', { error: loadError }, 'CatMemory');
    return { deleted: [], notFound: wanted };
  }
  const corpus = (rows ?? []) as Array<{ id: string; content: string }>;

  const doomed = new Map<string, string>();
  for (const fact of wanted) {
    const norm = fact.toLowerCase();
    const sigTokens = norm.split(/[^a-z0-9äöüéèàç]+/).filter(t => t.length >= 4);
    let matched = false;
    for (const m of corpus) {
      const c = m.content.toLowerCase();
      // Containment either way ("photography" ⊂ "Has photography skills…"),
      // or the fact's significant words appear in the memory (≥2 of them, or
      // the only one for single-word facts) — "income on weekends" should hit
      // "Wants to earn extra income on weekends." without exact phrasing.
      const tokenHits = sigTokens.filter(t => c.includes(t)).length;
      const tokenMatch =
        sigTokens.length > 0 && (sigTokens.length === 1 ? tokenHits === 1 : tokenHits >= 2);
      if (c.includes(norm) || norm.includes(c) || tokenMatch) {
        doomed.set(m.id, m.content);
        matched = true;
      }
    }
    if (!matched && embeddingsEnabled()) {
      try {
        const vec = await embedText(fact);
        if (vec) {
          const { data: near } = await supabase.rpc('match_cat_memories', {
            p_user_id: userId,
            query_embedding: JSON.stringify(vec),
            match_count: 3,
            min_similarity: FORGET_MATCH_SIMILARITY,
          });
          for (const n of (Array.isArray(near) ? near : []) as CatMemory[]) {
            doomed.set(n.id, n.content);
            matched = true;
          }
        }
      } catch (err) {
        logger.warn('forget semantic match failed', { err }, 'CatMemory');
      }
    }
    if (!matched) {
      result.notFound.push(fact);
    }
  }

  if (doomed.size > 0) {
    const { error } = await supabase
      .from(DATABASE_TABLES.CAT_MEMORIES)
      .delete()
      .eq('user_id', userId)
      .in('id', [...doomed.keys()]);
    if (error) {
      logger.warn('forgetMemoriesMatching delete failed', { error }, 'CatMemory');
      return { deleted: [], notFound: wanted };
    }
    result.deleted.push(...doomed.values());
  }
  return result;
}

// ─── Extraction ─────────────────────────────────────────────────────────────

/**
 * Cheap gate: only spend an LLM call on extraction when the user's message
 * plausibly discloses something durable about them (preference, identity, goal,
 * relationship). Mirrors the tool-use keyword pre-filter — most utility queries
 * ("convert 0.1 BTC", "what's my balance") skip extraction entirely.
 */
export function looksLikeSelfDisclosure(message: string): boolean {
  const m = message.toLowerCase();
  if (m.trim().length < 12) {
    return false;
  }
  return SELF_DISCLOSURE_SIGNALS.some(s => m.includes(s));
}

const SELF_DISCLOSURE_SIGNALS = [
  'i ',
  "i'm",
  'i am',
  'i prefer',
  'i like',
  'i love',
  'i hate',
  'i use',
  'i have',
  'i live',
  'i work',
  'i build',
  'i run',
  'my ',
  'me ',
  'we ',
  'our ',
  "we're",
  'remember',
  'prefer',
  'always',
  'never',
  'usually',
  'call me',
  'working on',
  'focused on',
];

const EXTRACTION_SYSTEM = `You extract durable, user-specific facts worth remembering long-term about a person, from one chat exchange.

Return ONLY a JSON array of short factual statements written in the third person, e.g.:
["Prefers Lightning over on-chain payments", "Building FleetCrown, a life-OS for builders", "Based in Zürich"]

Include ONLY stable facts: preferences, identity, goals, skills, relationships, or constraints that will still be true next week.
EXCLUDE: one-off requests, questions, the assistant's suggestions, transient state, and anything trivial or already obvious.
If there is nothing durable worth remembering, return exactly [].
Return at most ${MAX_FACTS_PER_TURN} facts. No prose, no markdown — just the JSON array.`;

/** Parse the model's reply into a clean list of fact strings (defensive). */
function parseFacts(raw: string): string[] {
  if (!raw) {
    return [];
  }
  // Strip code fences and grab the first JSON array if the model wrapped it.
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) {
    return [];
  }
  try {
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) {
      return [];
    }
    return arr
      .filter((x): x is string => typeof x === 'string')
      .map(s => s.trim().slice(0, MAX_FACT_CHARS))
      .filter(s => s.length >= 3)
      .slice(0, MAX_FACTS_PER_TURN);
  } catch {
    return [];
  }
}

/**
 * Consent gate: has this user turned memory off? Reads
 * user_ai_preferences.memory_enabled (default true — a missing row or a
 * failed read must never silently disable memory). Only consulted after the
 * cheap guards pass, so it costs one indexed lookup per self-disclosure turn.
 */
export async function memoryConsentGranted(
  supabase: AnySupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from(DATABASE_TABLES.USER_AI_PREFERENCES)
      .select('memory_enabled')
      .eq('user_id', userId)
      .maybeSingle();
    return (data as { memory_enabled?: boolean } | null)?.memory_enabled !== false;
  } catch {
    return true;
  }
}

/**
 * Distil durable facts from one exchange and store the new ones. Best-effort
 * and non-blocking — call without awaiting on the response path. Skips silently
 * when embeddings are off, the message isn't self-disclosure, the user has
 * turned memory off (user_ai_preferences.memory_enabled), or the LLM/DB
 * fails. Dedupes against existing memories by vector similarity.
 */
export async function extractAndStoreMemories(
  supabase: AnySupabaseClient,
  userId: string,
  conversationId: string | null,
  userMessage: string,
  assistantMessage: string,
  aiService: MemoryAiService,
  model: string
): Promise<void> {
  if (!embeddingsEnabled() || !looksLikeSelfDisclosure(userMessage)) {
    return;
  }
  if (!(await memoryConsentGranted(supabase, userId))) {
    return;
  }
  try {
    const { content } = await aiService.chatCompletion({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM },
        {
          role: 'user',
          content: `User said: "${userMessage}"\n\nAssistant replied: "${assistantMessage.slice(0, 800)}"\n\nExtract durable facts about the user as a JSON array.`,
        },
      ],
    });

    const facts = parseFacts(content);
    if (facts.length === 0) {
      return;
    }

    // Embed all candidates in one batch, then dedupe each against what we know.
    const vectors = await embedTexts(facts);
    const toInsert: Array<{ content: string; embedding: string }> = [];
    for (let i = 0; i < facts.length; i++) {
      const vec = vectors[i];
      if (!vec) {
        continue;
      }
      const { data: near } = await supabase.rpc('match_cat_memories', {
        p_user_id: userId,
        query_embedding: JSON.stringify(vec),
        match_count: 1,
        min_similarity: DEDUP_SIMILARITY,
      });
      if (Array.isArray(near) && near.length > 0) {
        continue; // already remember something equivalent
      }
      toInsert.push({ content: facts[i], embedding: JSON.stringify(vec) });
    }

    if (toInsert.length === 0) {
      return;
    }

    const { error } = await supabase.from(DATABASE_TABLES.CAT_MEMORIES).insert(
      toInsert.map(m => ({
        user_id: userId,
        content: m.content,
        embedding: m.embedding,
        source: 'chat',
        source_conversation_id: conversationId,
      }))
    );
    if (error) {
      logger.warn('Failed to insert cat memories', { error }, 'CatMemory');
      return;
    }

    await pruneIfNeeded(supabase, userId);
  } catch (err) {
    logger.warn('extractAndStoreMemories threw', { err }, 'CatMemory');
  }
}

/** Keep the corpus bounded: delete the oldest memories beyond the per-user cap. */
async function pruneIfNeeded(supabase: AnySupabaseClient, userId: string): Promise<void> {
  const { count } = await supabase
    .from(DATABASE_TABLES.CAT_MEMORIES)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (!count || count <= MAX_MEMORIES_PER_USER) {
    return;
  }
  const { data: oldest } = await supabase
    .from(DATABASE_TABLES.CAT_MEMORIES)
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(count - MAX_MEMORIES_PER_USER);
  const ids = (oldest as Array<{ id: string }> | null)?.map(r => r.id) ?? [];
  if (ids.length > 0) {
    await supabase.from(DATABASE_TABLES.CAT_MEMORIES).delete().in('id', ids);
  }
}

// ─── Management (list / delete) ───────────────────────────────────────────────

/** A load either succeeds with memories or fails — never conflate the two. */
export type ListMemoriesResult = { ok: true; memories: CatMemory[] } | { ok: false; error: string };

/**
 * List a user's memories, newest first, distinguishing "genuinely empty" from
 * "query failed" so a caller at a UI boundary can show a real error instead of
 * a misleading "no memories yet" empty state.
 */
export async function listMemoriesResult(
  supabase: AnySupabaseClient,
  userId: string
): Promise<ListMemoriesResult> {
  const { data, error } = await supabase
    .from(DATABASE_TABLES.CAT_MEMORIES)
    .select('id, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_MEMORIES_PER_USER);
  if (error) {
    logger.warn('listMemories failed', { error }, 'CatMemory');
    return { ok: false, error: error.message };
  }
  return { ok: true, memories: (data ?? []) as CatMemory[] };
}

/**
 * Convenience wrapper for grounding callers (offer/writing context) that
 * legitimately degrade to an empty list on failure — they only feed the model
 * "(none)". UI boundaries should use listMemoriesResult to surface real errors.
 */
export async function listMemories(
  supabase: AnySupabaseClient,
  userId: string
): Promise<CatMemory[]> {
  const result = await listMemoriesResult(supabase, userId);
  return result.ok ? result.memories : [];
}

/** Delete one memory the user owns. RLS guarantees cross-user safety. */
export async function deleteMemory(
  supabase: AnySupabaseClient,
  userId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from(DATABASE_TABLES.CAT_MEMORIES)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) {
    logger.warn('deleteMemory failed', { error }, 'CatMemory');
    return false;
  }
  return true;
}

/** Forget everything Cat remembers about the user. */
export async function deleteAllMemories(
  supabase: AnySupabaseClient,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from(DATABASE_TABLES.CAT_MEMORIES)
    .delete()
    .eq('user_id', userId);
  if (error) {
    logger.warn('deleteAllMemories failed', { error }, 'CatMemory');
    return false;
  }
  return true;
}

// ─── Import (bring memory from another AI) ─────────────────────────────────────

/** Cap facts accepted from a single paste — a one-time bulk import, kept sane. */
const MAX_IMPORT_FACTS = 200;
/** Imported entries may be a full sentence — allow more than a chat-distilled fact. */
const MAX_IMPORT_FACT_CHARS = 500;
/** Batch size for embedding many candidates without oversized requests. */
const IMPORT_EMBED_BATCH = 100;

const IMPORT_HEADER_SET = new Set<string>(MEMORY_IMPORT_CATEGORIES.map(c => c.toLowerCase()));

export interface MemoryImportResult {
  /** Candidate facts found in the pasted text. */
  total: number;
  /** Newly stored (after dedup). */
  imported: number;
  /** Dropped because an equivalent memory already existed. */
  skipped: number;
  /** False when no embeddings provider is configured — imported facts are stored
   *  but won't be recalled semantically until one is set. */
  embeddingsEnabled: boolean;
}

/** Some assistants answer with a JSON array of strings — accept that shape too. */
function tryParseJsonArray(raw: string): string[] {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) {
    return [];
  }
  try {
    const arr = JSON.parse(match[0]);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Strip list markers, numbering, markdown headings/bold from a line. */
function stripLineDecorations(line: string): string {
  return line
    .replace(/^\s*#{1,6}\s*/, '') // markdown heading
    .replace(/^\s*[-*•·]\s+/, '') // bullet
    .replace(/^\s*\d+[.)]\s+/, '') // "1. " / "1) "
    .replace(/\*\*/g, '') // bold
    .replace(/^\s*[-–—]\s*/, '') // stray leading dash (e.g. exposed after a date strip)
    .trim();
}

/** Remove a leading date tag like "[2026-01-01] - " or "[unknown] - ". */
function stripDatePrefix(line: string): string {
  return line.replace(/^\[[^\]]*\]\s*[-–—:]\s*/, '').trim();
}

/** True when a line is just a category heading (e.g. "Projects", "**Identity**:"). */
function isImportHeader(line: string): boolean {
  const normalized = stripLineDecorations(line).replace(/:$/, '').trim().toLowerCase();
  return IMPORT_HEADER_SET.has(normalized);
}

/**
 * Turn a pasted memory export (from any AI) into a clean list of fact strings.
 * Defensive: accepts a JSON array, or category-grouped markdown/bulleted/dated
 * lines. Strips headers, bullets, numbering and date tags; dedupes and caps.
 */
export function parseImportedMemories(raw: string): string[] {
  if (!raw || !raw.trim()) {
    return [];
  }
  const jsonFacts = tryParseJsonArray(raw);
  const isJson = jsonFacts.length > 0;
  const lines = isJson ? jsonFacts : raw.replace(/```(?:json|markdown)?/gi, '').split('\n');

  const seen = new Set<string>();
  const facts: string[] = [];
  for (const rawLine of lines) {
    let line = (rawLine ?? '').trim();
    if (!line) {
      continue;
    }
    if (!isJson) {
      if (isImportHeader(line)) {
        continue;
      }
      line = stripDatePrefix(stripLineDecorations(line));
      line = stripLineDecorations(line); // a date strip can expose a leading dash
    }
    const lower = line.toLowerCase();
    if (!line || line.length < 3 || lower === '(none)' || lower === 'none') {
      continue;
    }
    const key = lower.slice(0, MAX_IMPORT_FACT_CHARS);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    facts.push(line.slice(0, MAX_IMPORT_FACT_CHARS));
    if (facts.length >= MAX_IMPORT_FACTS) {
      break;
    }
  }
  return facts;
}

/**
 * Import durable facts from a memory export the user pasted from another AI.
 * Embeds each (for recall + dedup), skips ones already equivalent to a stored
 * memory, inserts the rest as `source: 'import'`, and prunes to the per-user cap.
 * Degrades gracefully: with no embeddings provider, facts are still stored
 * (embeddingsEnabled=false in the result) but can't be recalled by meaning yet.
 */
export async function importMemories(
  supabase: AnySupabaseClient,
  userId: string,
  rawText: string
): Promise<MemoryImportResult> {
  const facts = parseImportedMemories(rawText);
  const useEmbeddings = embeddingsEnabled();
  const result: MemoryImportResult = {
    total: facts.length,
    imported: 0,
    skipped: 0,
    embeddingsEnabled: useEmbeddings,
  };
  if (facts.length === 0) {
    return result;
  }

  // Exact-content dedup against what's already stored. Semantic dedup below
  // catches near-duplicates, but only when embeddings are on — this keeps the
  // "skips what it already knows" promise true even with no provider, and makes
  // re-importing the same paste a safe no-op.
  const { data: existingRows } = await supabase
    .from(DATABASE_TABLES.CAT_MEMORIES)
    .select('content')
    .eq('user_id', userId)
    .limit(MAX_MEMORIES_PER_USER);
  const existing = new Set<string>(
    ((existingRows as Array<{ content: string }> | null) ?? []).map(r =>
      r.content.trim().toLowerCase()
    )
  );

  const vectors: (number[] | null)[] = [];
  if (useEmbeddings) {
    for (let i = 0; i < facts.length; i += IMPORT_EMBED_BATCH) {
      vectors.push(...(await embedTexts(facts.slice(i, i + IMPORT_EMBED_BATCH))));
    }
  } else {
    for (let i = 0; i < facts.length; i++) {
      vectors.push(null);
    }
  }

  const toInsert: Array<{
    user_id: string;
    content: string;
    embedding: string | null;
    source: string;
    source_conversation_id: null;
  }> = [];
  for (let i = 0; i < facts.length; i++) {
    const exactKey = facts[i].trim().toLowerCase();
    if (existing.has(exactKey)) {
      result.skipped++;
      continue; // already stored verbatim
    }
    const vec = vectors[i];
    if (vec) {
      const { data: near } = await supabase.rpc('match_cat_memories', {
        p_user_id: userId,
        query_embedding: JSON.stringify(vec),
        match_count: 1,
        min_similarity: DEDUP_SIMILARITY,
      });
      if (Array.isArray(near) && near.length > 0) {
        result.skipped++;
        continue; // already remember something equivalent
      }
    }
    // Guard against exact dupes within this same paste when embeddings are off.
    existing.add(exactKey);
    toInsert.push({
      user_id: userId,
      content: facts[i],
      embedding: vec ? JSON.stringify(vec) : null,
      source: 'import',
      source_conversation_id: null,
    });
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from(DATABASE_TABLES.CAT_MEMORIES).insert(toInsert);
    if (error) {
      logger.warn('Failed to insert imported cat memories', { error }, 'CatMemory');
      return result;
    }
    result.imported = toInsert.length;
    await pruneIfNeeded(supabase, userId);
  }
  return result;
}
