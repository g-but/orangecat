/**
 * Public feedback + Ask Cat — the customer-interaction learning loop.
 *
 * Any visitor (no account needed) can ask a question or leave feedback on
 * /feedback. Cat answers immediately from the platform knowledge SSOT
 * (src/config/platform-knowledge.ts), and the whole exchange is stored in
 * platform_feedback. Stored exchanges — especially ones a human later
 * corrected via resolution_note — are recalled on future questions, so the
 * Cat's answers improve with every customer interaction instead of starting
 * from zero each time.
 *
 * Everything degrades gracefully: no platform LLM → the message is still
 * stored and the caller shows "the team has it"; a failed insert never
 * swallows an answer the visitor is waiting for.
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { DATABASE_TABLES } from '@/config/database-tables';
import { PLATFORM_KNOWLEDGE } from '@/config/platform-knowledge';
import { callPlatformJson, parseJsonLoose } from '@/services/cat/platform-llm';
import { logger } from '@/utils/logger';

export type FeedbackKind = 'question' | 'feedback';

export interface PublicAskInput {
  message: string;
  email?: string | null;
  pagePath?: string | null;
  /** Present when the submitter happens to be signed in. */
  userId?: string | null;
}

export interface PublicAskResult {
  /** Stored row id — null only when the insert itself failed. */
  id: string | null;
  kind: FeedbackKind;
  /** Cat's reply; null when the platform LLM was unavailable or timed out. */
  answer: string | null;
}

/** Visitors are waiting behind this call — cap it hard. */
const ANSWER_TIMEOUT_MS = 15_000;
/** How many recent stored exchanges to scan for related ones. */
const RECALL_SCAN_LIMIT = 200;
/** How many related past exchanges to inject into the prompt. */
const RECALL_TOP = 5;

const ANSWER_SYSTEM = `You are Cat, OrangeCat's AI agent, answering a PUBLIC visitor on the platform's feedback page. The visitor may not have an account. Be warm, plain-spoken, and brief (2-6 sentences).

Ground every claim in the PLATFORM KNOWLEDGE below — it is your only source of truth about OrangeCat. If the knowledge doesn't answer the question, say so honestly and tell them the team reads every message on this page and will follow up. Never invent features, prices, or dates.

If PAST CUSTOMER INTERACTIONS are provided, learn from them: a "team correction" on a past exchange is authoritative and outranks your own phrasing. Stay consistent with corrected answers.

Reply in the language of the visitor's message.

Return ONLY a JSON object:
{"kind": "question" | "feedback", "answer": "your reply to the visitor"}

kind is "question" when the visitor is asking something, "feedback" when they are mainly reporting a problem, a wish, or an opinion. Always include an answer: for feedback, acknowledge concretely what they reported (echo it back so they know they were heard) and say the team reads every message — do not paper over problems with marketing.`;

interface ModelReply {
  kind?: string;
  answer?: string;
}

interface StoredExchange {
  message: string;
  cat_answer: string | null;
  resolution_note: string | null;
}

/** Significant lowercase terms of a text, for cheap lexical relatedness. */
function significantTerms(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9äöüéèàç]+/)
      .filter(t => t.length >= 4)
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let hits = 0;
  for (const t of a) {
    if (b.has(t)) {
      hits++;
    }
  }
  return hits / Math.min(a.size, b.size);
}

/**
 * Recall past exchanges related to the current message. Lexical (term overlap)
 * on the most recent answered/resolved rows — anonymous visitors have no
 * per-user memory, so the platform-wide interaction history IS the memory.
 * Best-effort: returns '' on any failure (including a missing table before the
 * migration is applied).
 */
async function recallPastInteractions(
  supabase: AnySupabaseClient,
  message: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from(DATABASE_TABLES.PLATFORM_FEEDBACK)
      .select('message, cat_answer, resolution_note')
      .in('status', ['answered', 'resolved'])
      .order('created_at', { ascending: false })
      .limit(RECALL_SCAN_LIMIT);
    if (error || !data) {
      return '';
    }
    const terms = significantTerms(message);
    const ranked = (data as StoredExchange[])
      .map(row => ({ row, score: overlapScore(terms, significantTerms(row.message)) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, RECALL_TOP);
    if (ranked.length === 0) {
      return '';
    }
    return ranked
      .map(({ row }) => {
        const lines = [`Visitor: ${row.message.slice(0, 300)}`];
        if (row.cat_answer) {
          lines.push(`Cat answered: ${row.cat_answer.slice(0, 300)}`);
        }
        if (row.resolution_note) {
          lines.push(`Team correction (authoritative): ${row.resolution_note.slice(0, 300)}`);
        }
        return lines.join('\n');
      })
      .join('\n---\n');
  } catch (err) {
    logger.warn('platform-feedback: recall failed', { err: String(err) }, 'PlatformFeedback');
    return '';
  }
}

/** Heuristic fallback classifier for when the model is unavailable. */
function guessKind(message: string): FeedbackKind {
  const m = message.trim();
  return m.includes('?') || /^(how|what|why|where|when|who|can|does|is|are|do)\b/i.test(m)
    ? 'question'
    : 'feedback';
}

/**
 * Answer a public message and record the whole exchange. The insert is part of
 * the contract (it's how Cat learns), but a storage failure must never eat an
 * answer the visitor is looking at — so the answer is produced first and
 * returned regardless.
 */
export async function answerAndRecordFeedback(
  supabase: AnySupabaseClient,
  input: PublicAskInput
): Promise<PublicAskResult> {
  const past = await recallPastInteractions(supabase, input.message);

  const userPrompt = [
    `PLATFORM KNOWLEDGE:\n${PLATFORM_KNOWLEDGE}`,
    past ? `PAST CUSTOMER INTERACTIONS:\n${past}` : null,
    input.pagePath ? `The visitor was on page: ${input.pagePath}` : null,
    `Visitor's message:\n"""${input.message}"""`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const raw = await callPlatformJson(ANSWER_SYSTEM, userPrompt, {
    temperature: 0.4,
    maxTokens: 600,
    timeoutMs: ANSWER_TIMEOUT_MS,
  });
  const parsed = parseJsonLoose<ModelReply>(raw);

  const answer =
    typeof parsed?.answer === 'string' && parsed.answer.trim() ? parsed.answer.trim() : null;
  const kind: FeedbackKind =
    parsed?.kind === 'question' || parsed?.kind === 'feedback'
      ? parsed.kind
      : guessKind(input.message);

  let id: string | null = null;
  try {
    const { data, error } = await supabase
      .from(DATABASE_TABLES.PLATFORM_FEEDBACK)
      .insert({
        user_id: input.userId ?? null,
        email: input.email?.trim() || null,
        page_path: input.pagePath?.trim() || null,
        message: input.message,
        kind,
        cat_answer: answer,
        answered_at: answer ? new Date().toISOString() : null,
        status: answer ? 'answered' : 'new',
      })
      .select('id')
      .single();
    if (error) {
      logger.error(
        'platform-feedback: insert failed',
        { error: error.message },
        'PlatformFeedback'
      );
    } else {
      id = (data as { id: string } | null)?.id ?? null;
    }
  } catch (err) {
    logger.error('platform-feedback: insert threw', { err: String(err) }, 'PlatformFeedback');
  }

  return { id, kind, answer };
}
