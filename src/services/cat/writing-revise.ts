/**
 * Revise engine — the in-editor AI writing help. Where the draft engine writes a
 * whole post/article from scratch, this transforms text the author ALREADY wrote:
 * improve it, continue it, tighten it, change its tone, or fix its grammar — plus
 * two whole-document helpers (suggest titles, generate an excerpt) and an outline
 * seeder. Same grounding + never-throw contract as the draft engine: any failure
 * returns null / [] so the editor degrades to "nothing happened", never a crash.
 *
 * Voice-grounded, not fact-grounded: these ops rework the user's own words, so we
 * fetch only their voice (recent posts), not their full world model — keeps every
 * keystroke-triggered revision fast.
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { ARTICLE_LIMITS } from '@/config/articles';
import { TIMELINE_CONTENT_LIMITS } from '@/config/timeline';
import { callPlatformJson, parseJsonLoose } from './platform-llm';
import { GROUNDING_RULES, buildVoiceContext } from './writing-context';
import type { ReviseAction, TonePreset } from './writing-types';
import { logger } from '@/utils/logger';

const TONE_INSTRUCTIONS: Record<TonePreset, string> = {
  casual: 'Rewrite in a relaxed, conversational tone — like talking to a friend, plain words.',
  formal: 'Rewrite in a polished, professional tone — precise, measured, no slang.',
  punchy: 'Rewrite to be punchy and direct — short sentences, strong verbs, no filler.',
  warm: 'Rewrite to be warm and human — empathetic, encouraging, generous in spirit.',
};

const ACTION_INSTRUCTIONS: Record<Exclude<ReviseAction, 'tone' | 'outline'>, string> = {
  improve:
    'Rewrite this text to be clearer, sharper, and better-flowing WITHOUT changing its meaning, facts, or the author’s voice. Keep roughly the same length.',
  continue:
    'Continue the text naturally from where it stops — write the NEXT one or two paragraphs. Do NOT repeat or rephrase what is already there; only return the new continuation.',
  tighten:
    'Make this text more concise — cut filler and redundancy, keep every real idea and the author’s voice. Shorter is the goal.',
  expand:
    'Expand this text with more depth — add a concrete detail, example, or consequence that follows from what is already there. Do not pad with filler or fabricate facts.',
  grammar:
    'Fix ONLY grammar, spelling, and punctuation. Do not rephrase, restructure, or change word choice beyond what correctness requires.',
};

const REVISE_SYSTEM_PREAMBLE = `You are the writing companion inside OrangeCat, editing a long-form article the user is writing. You transform the user's OWN text — you never lecture, never add meta-commentary, never wrap the result in quotes or code fences. Return only the revised prose as Markdown.`;

/**
 * Short-post preamble. The same actions (improve/tighten/tone…) apply, but the
 * output must stay a short social post — never balloon into an article. Used
 * when the composer is a timeline post/reply rather than the article editor.
 */
function preambleForKind(kind: ReviseKind): string {
  if (kind === 'post') {
    return `You are the writing companion inside OrangeCat, editing a SHORT social post (tweet-length) the user is writing. You transform the user's OWN text — never lecture, never add meta-commentary, never wrap it in quotes or code fences, no Markdown headings or lists. Keep it a short post under ${TIMELINE_CONTENT_LIMITS.post} characters; NEVER expand it into an essay. Return only the post text.`;
  }
  return REVISE_SYSTEM_PREAMBLE;
}

function bodyLimitForKind(kind: ReviseKind): number {
  return kind === 'post' ? TIMELINE_CONTENT_LIMITS.post : ARTICLE_LIMITS.body;
}

/** Clamp text sent to the model — a runaway body shouldn't blow the token budget. */
const MAX_INPUT_CHARS = 8000;

function clampInput(text: string): string {
  return text.length > MAX_INPUT_CHARS ? text.slice(0, MAX_INPUT_CHARS) : text;
}

/** Whether we're editing a long-form article body or a short timeline post. */
export type ReviseKind = 'post' | 'article';

export interface ReviseInput {
  action: ReviseAction;
  /** The selected text, or the whole body, to operate on. */
  text: string;
  /** For action:'tone'. */
  tone?: TonePreset;
  /** Article title, for grounding the revision in what the piece is about. */
  title?: string;
  /** For action:'outline' — the topic to outline. */
  topic?: string;
  /** Optional free-form steer ("make it less salesy"). */
  instruction?: string;
  /** Long-form article (default) vs a short post — changes framing + length clamp. */
  kind?: ReviseKind;
}

/**
 * Transform the user's text per `action`. Returns the revised Markdown, or null
 * on any failure (caller leaves the editor untouched).
 */
export async function reviseText(
  supabase: AnySupabaseClient,
  userId: string,
  input: ReviseInput
): Promise<string | null> {
  if (input.action === 'outline') {
    return outlineForTopic(supabase, userId, input.topic || input.text, input.instruction);
  }

  const text = clampInput(input.text.trim());
  if (!text) {
    return null;
  }

  const directive =
    input.action === 'tone'
      ? TONE_INSTRUCTIONS[input.tone ?? 'casual']
      : ACTION_INSTRUCTIONS[input.action];

  const kind = input.kind ?? 'article';
  const { recentBlob } = await buildVoiceContext(supabase, userId);
  const system = `${preambleForKind(kind)}

TASK: ${directive}
${input.instruction ? `The user also asked: ${input.instruction}\n` : ''}
${GROUNDING_RULES}

Output ONLY JSON: {"result":"the revised ${kind === 'post' ? 'post' : 'markdown'}"}.`;

  const user = `${input.title ? `Article title: ${input.title}\n` : ''}The author's recent posts (their voice — match it):
${recentBlob}

TEXT TO ${input.action === 'continue' ? 'CONTINUE FROM' : 'REVISE'}:
"""
${text}
"""

Return the ${input.action === 'continue' ? 'continuation' : 'revised text'} as JSON.`;

  const raw = await callPlatformJson(system, user, { temperature: 0.6, maxTokens: 2000 });
  const parsed = parseJsonLoose<{ result?: unknown }>(raw);
  const result = typeof parsed?.result === 'string' ? parsed.result.trim() : '';
  if (!result) {
    logger.warn('writing-revise: empty result', { action: input.action, kind }, 'WritingRevise');
    return null;
  }
  return result.slice(0, bodyLimitForKind(kind));
}

async function outlineForTopic(
  supabase: AnySupabaseClient,
  userId: string,
  topic: string,
  instruction?: string
): Promise<string | null> {
  const cleanTopic = topic.trim().slice(0, 300);
  if (!cleanTopic) {
    return null;
  }
  const { recentBlob } = await buildVoiceContext(supabase, userId);
  const system = `${REVISE_SYSTEM_PREAMBLE}

TASK: Propose a section outline for a long-form article on the given topic, so the author can start writing. Return Markdown: 3–6 "## " section headings, each followed by a single italic line (one sentence) describing what that section covers. Do NOT write the article body itself.
${instruction ? `The user also asked: ${instruction}\n` : ''}
${GROUNDING_RULES}

Output ONLY JSON: {"result":"the markdown outline"}.`;
  const user = `The author's recent posts (their voice):
${recentBlob}

TOPIC: ${cleanTopic}

Return the outline as JSON.`;
  const raw = await callPlatformJson(system, user, { temperature: 0.6, maxTokens: 900 });
  const parsed = parseJsonLoose<{ result?: unknown }>(raw);
  const result = typeof parsed?.result === 'string' ? parsed.result.trim() : '';
  return result ? result.slice(0, ARTICLE_LIMITS.body) : null;
}

/**
 * Suggest sharper headline options for a body the user has written. Grounded in
 * the actual body (never generic), returns up to `count` titles.
 */
export async function suggestTitles(
  supabase: AnySupabaseClient,
  userId: string,
  body: string,
  count = 5
): Promise<string[]> {
  const text = clampInput(body.trim());
  if (!text) {
    return [];
  }
  const n = Math.min(Math.max(count, 1), 8);
  const { recentBlob } = await buildVoiceContext(supabase, userId);
  const system = `${REVISE_SYSTEM_PREAMBLE}

TASK: Suggest ${n} strong, specific headline options for the article below. Each a real headline (not a category), concrete, in the author's voice, no clickbait, no colon-subtitle cliché unless it genuinely helps. Each must fit within ${ARTICLE_LIMITS.title} characters.

${GROUNDING_RULES}

Output ONLY JSON: {"titles":["...","..."]}.`;
  const user = `Author's voice (recent posts):
${recentBlob}

ARTICLE BODY:
"""
${text}
"""

Return ${n} titles as JSON.`;
  const raw = await callPlatformJson(system, user, { temperature: 0.8, maxTokens: 500 });
  const parsed = parseJsonLoose<{ titles?: unknown }>(raw);
  const arr = Array.isArray(parsed?.titles) ? parsed.titles : [];
  return arr
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map(t =>
      t
        .trim()
        .replace(/^["']|["']$/g, '')
        .slice(0, ARTICLE_LIMITS.title)
    )
    .slice(0, n);
}

/**
 * Generate a one-line excerpt/subtitle for a body. Complements the non-AI
 * `deriveExcerpt` fallback — this one reads the whole piece and writes a hook.
 */
export async function generateExcerpt(
  supabase: AnySupabaseClient,
  userId: string,
  body: string,
  title?: string
): Promise<string | null> {
  const text = clampInput(body.trim());
  if (!text) {
    return null;
  }
  // Voice matters less for a one-liner; keep it a single fast call.
  const system = `${REVISE_SYSTEM_PREAMBLE}

TASK: Write ONE compelling sentence (max ${ARTICLE_LIMITS.excerpt} characters) that makes someone want to read this article. It appears in the feed and previews. No "In this article…", no clickbait — a real hook drawn from the actual content.

${GROUNDING_RULES}

Output ONLY JSON: {"result":"the excerpt"}.`;
  const user = `${title ? `Title: ${title}\n` : ''}ARTICLE BODY:
"""
${text}
"""

Return the excerpt as JSON.`;
  const raw = await callPlatformJson(system, user, { temperature: 0.7, maxTokens: 200 });
  const parsed = parseJsonLoose<{ result?: unknown }>(raw);
  const result = typeof parsed?.result === 'string' ? parsed.result.trim() : '';
  return result ? result.replace(/^["']|["']$/g, '').slice(0, ARTICLE_LIMITS.excerpt) : null;
}
