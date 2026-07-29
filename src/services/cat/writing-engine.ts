/**
 * Writing engine — the user's AI writing companion.
 *
 * Given what OrangeCat knows about a person (profile, entities, durable memories,
 * and the posts they've already written = their voice), it proposes topics they'd
 * genuinely want to write, and drafts full posts or long-form articles in their
 * voice. Mirrors the offer-engine's grounding + never-throw contract: any failure
 * returns [] / null so the composer degrades to a plain blank editor.
 *
 * Hard grounding rules (same lineage as the "Cat invented personas" fix): never
 * fabricate facts, stats, quotes, or people; ground every suggestion in a real
 * context item; Bitcoin is BTC, never "sats".
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { ARTICLE_LIMITS } from '@/config/articles';
import { TIMELINE_CONTENT_LIMITS } from '@/config/timeline';
import { callPlatformJson, parseJsonLoose } from './platform-llm';
import { GROUNDING_RULES, buildWriterContext, contextPrompt } from './writing-context';
import type {
  ArticleDraft,
  PostDraft,
  ProposedTopic,
  ReplyIntent,
  WritingKind,
} from './writing-types';
import { logger } from '@/utils/logger';

export type { ArticleDraft, PostDraft, ProposedTopic, WritingKind } from './writing-types';

const MAX_TOPICS = 8;

// ---------------------------------------------------------------------------
// Topic suggestions
// ---------------------------------------------------------------------------

export async function suggestTopics(
  supabase: AnySupabaseClient,
  userId: string,
  opts?: { count?: number; kind?: WritingKind | 'any'; focus?: string }
): Promise<ProposedTopic[]> {
  const count = Math.min(Math.max(opts?.count ?? 5, 1), MAX_TOPICS);
  const kind = opts?.kind ?? 'any';
  const ctx = await buildWriterContext(supabase, userId);

  const kindLine =
    kind === 'any'
      ? 'Mix quick POSTS (a sharp thought that sparks replies) and longer ARTICLES (a topic worth 3–8 minutes of reading). Set "kind" to "post" or "article" per idea.'
      : `Every idea must be a ${kind.toUpperCase()} ("kind":"${kind}").`;

  const system = `You are the user's writing companion inside OrangeCat — a Bitcoin-native platform for expressing ideas in text. Suggest specific things THIS person would genuinely want to write and would write well, so they publish more often.

${kindLine}

Each idea: a concrete, specific "title" (the headline/topic, not a category) and a one-line "angle" (the take or hook, in their voice). Favor ideas that invite other people to respond and share their own experience.

${GROUNDING_RULES}

Output ONLY JSON: {"topics":[{"kind":"post","title":"...","angle":"..."}]}. Return up to ${count} ideas. Quality over quantity — fewer strong ideas beat filler.`;

  const raw = await callPlatformJson(
    system,
    `${contextPrompt(ctx, opts?.focus)}\nPropose up to ${count} topics as JSON.`,
    {
      temperature: 0.75,
      maxTokens: 1200,
    }
  );
  return parseTopics(raw, count, kind);
}

function parseTopics(
  raw: string | null,
  count: number,
  kind: WritingKind | 'any'
): ProposedTopic[] {
  const parsed = parseJsonLoose<{ topics?: unknown[] } | unknown[]>(raw);
  const arr: unknown[] = Array.isArray(parsed) ? parsed : (parsed?.topics ?? []);
  return arr
    .filter(
      (t): t is { kind?: string; title: string; angle?: string } =>
        !!t &&
        typeof (t as { title?: unknown }).title === 'string' &&
        (t as { title: string }).title.trim().length > 0
    )
    .map(t => {
      const k: WritingKind =
        t.kind === 'article' || t.kind === 'post'
          ? t.kind
          : kind === 'article'
            ? 'article'
            : 'post';
      return {
        kind: kind === 'any' ? k : kind,
        title: t.title.trim().slice(0, ARTICLE_LIMITS.title),
        angle: String(t.angle ?? '')
          .trim()
          .slice(0, 200),
      };
    })
    .slice(0, count);
}

// ---------------------------------------------------------------------------
// Post draft
// ---------------------------------------------------------------------------

export async function draftPost(
  supabase: AnySupabaseClient,
  userId: string,
  opts?: { topic?: string; focus?: string }
): Promise<PostDraft | null> {
  const ctx = await buildWriterContext(supabase, userId);
  const system = `You are the user's writing companion inside OrangeCat. Write ONE short post in the user's authentic voice that they can publish right now. It should share a genuine, specific thought or question and invite other people to respond with their own take — the goal is to get a real conversation going.

- Keep it under ${TIMELINE_CONTENT_LIMITS.post} characters. No title, no preamble, no hashtags, no emoji spam.
- Sound like a person, not a brand. One clear idea.

${GROUNDING_RULES}

Output ONLY JSON: {"text":"the post"}.`;

  const userPrompt = `${contextPrompt(ctx, opts?.focus)}${
    opts?.topic ? `\nWrite the post about: ${opts.topic}\n` : ''
  }\nWrite the post as JSON.`;

  const raw = await callPlatformJson(system, userPrompt, { temperature: 0.8, maxTokens: 600 });
  const parsed = parseJsonLoose<{ text?: unknown }>(raw);
  const text = typeof parsed?.text === 'string' ? parsed.text.trim() : '';
  if (!text) {
    logger.warn('writing-engine: empty post draft', {}, 'WritingEngine');
    return null;
  }
  return { text: text.slice(0, TIMELINE_CONTENT_LIMITS.editPost) };
}

// ---------------------------------------------------------------------------
// Reply draft — help the user comment on someone else's post
// ---------------------------------------------------------------------------

const REPLY_INTENTS: Record<ReplyIntent, string> = {
  thoughtful:
    'Add a thoughtful, substantive response that genuinely moves the conversation forward.',
  add: 'Add a specific point, example, or angle the post did NOT already mention.',
  question: 'Ask ONE genuine, specific question that invites the author to say more.',
  agree: 'Affirm the point and build on it with your own concrete experience or example.',
  pushback:
    'Offer respectful disagreement — name clearly where you see it differently, without hostility or snark.',
};

export async function draftReply(
  supabase: AnySupabaseClient,
  userId: string,
  opts: { parentText: string; parentAuthor?: string; intent?: ReplyIntent }
): Promise<PostDraft | null> {
  const parentText = opts.parentText.trim().slice(0, 4000);
  if (!parentText) {
    return null;
  }
  const intent = opts.intent ?? 'thoughtful';
  const ctx = await buildWriterContext(supabase, userId);
  const system = `You are the user's writing companion inside OrangeCat. Write ONE reply the user can post to the conversation below, in THEIR authentic voice, as a real contribution. ${REPLY_INTENTS[intent]}

- React to what the post ACTUALLY says — do not restate or summarise it back.
- Keep it under ${TIMELINE_CONTENT_LIMITS.post} characters. No hashtags, no emoji spam, no "Great post!" filler.
- Sound like a real person joining the discussion, not a brand.

${GROUNDING_RULES}

Output ONLY JSON: {"text":"the reply"}.`;

  const userPrompt = `${contextPrompt(ctx)}

The post you are replying to${opts.parentAuthor ? ` (by @${opts.parentAuthor})` : ''}:
"""
${parentText}
"""

Write the reply as JSON.`;

  const raw = await callPlatformJson(system, userPrompt, { temperature: 0.8, maxTokens: 600 });
  const parsed = parseJsonLoose<{ text?: unknown }>(raw);
  const text = typeof parsed?.text === 'string' ? parsed.text.trim() : '';
  if (!text) {
    logger.warn('writing-engine: empty reply draft', { intent }, 'WritingEngine');
    return null;
  }
  return { text: text.slice(0, TIMELINE_CONTENT_LIMITS.editPost) };
}

// ---------------------------------------------------------------------------
// Article draft
// ---------------------------------------------------------------------------

export async function draftArticle(
  supabase: AnySupabaseClient,
  userId: string,
  opts?: { topic?: string; focus?: string }
): Promise<ArticleDraft | null> {
  const ctx = await buildWriterContext(supabase, userId);
  const system = `You are the user's writing companion inside OrangeCat — a Bitcoin-native platform for long-form expression. Write a COMPLETE, publishable long-form article in the user's authentic voice.

Structure:
- A compelling, specific "title" (a real headline, not a category).
- A one-sentence "excerpt" that makes someone want to read.
- A "body" in Markdown: an engaging opening, 2–5 sections with "## " subheadings, short readable paragraphs, and a bulleted list where it genuinely helps. Aim for a 3–7 minute read. End with a thought that invites the reader to reflect or respond. Do NOT repeat the title as an H1 inside the body.

${GROUNDING_RULES}

Output ONLY JSON: {"title":"...","excerpt":"...","body":"...markdown..."}.`;

  const userPrompt = `${contextPrompt(ctx, opts?.focus)}${
    opts?.topic ? `\nWrite the article about: ${opts.topic}\n` : ''
  }\nWrite the article as JSON.`;

  const raw = await callPlatformJson(system, userPrompt, {
    temperature: 0.7,
    maxTokens: 4000,
    longform: true,
  });
  const parsed = parseJsonLoose<{ title?: unknown; excerpt?: unknown; body?: unknown }>(raw);
  const title = typeof parsed?.title === 'string' ? parsed.title.trim() : '';
  const body = typeof parsed?.body === 'string' ? parsed.body.trim() : '';
  if (!title || !body) {
    logger.warn('writing-engine: incomplete article draft', {}, 'WritingEngine');
    return null;
  }
  const excerpt = typeof parsed?.excerpt === 'string' ? parsed.excerpt.trim() : '';
  return {
    title: title.slice(0, ARTICLE_LIMITS.title),
    excerpt: excerpt.slice(0, ARTICLE_LIMITS.excerpt),
    body: body.slice(0, ARTICLE_LIMITS.body),
  };
}
