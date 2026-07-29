/**
 * Browser client for the AI writing endpoints. Thin fetch wrappers that return
 * typed drafts/topics, or throw a friendly Error the composer can surface.
 */

import type {
  ArticleDraft,
  PostDraft,
  ProposedTopic,
  ReplyIntent,
  ReviseAction,
  TonePreset,
  WritingKind,
} from '@/services/cat/writing-types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    // Standard API errors carry `error: { code, message }`; tolerate a bare string too.
    const err = json?.error;
    const message =
      (typeof err === 'string' ? err : err?.message) ||
      'The AI writer is unavailable right now. Please try again.';
    throw new Error(message);
  }
  return json.data as T;
}

export function fetchWritingTopics(opts: {
  kind?: WritingKind | 'any';
  count?: number;
  focus?: string;
}): Promise<ProposedTopic[]> {
  return postJson<{ topics: ProposedTopic[] }>('/api/ai/writing/topics', opts).then(d => d.topics);
}

export function fetchArticleDraft(opts: { topic?: string; focus?: string }): Promise<ArticleDraft> {
  return postJson<{ draft: ArticleDraft }>('/api/ai/writing/draft', {
    mode: 'article',
    ...opts,
  }).then(d => d.draft);
}

export function fetchPostDraft(opts: { topic?: string; focus?: string }): Promise<PostDraft> {
  return postJson<{ draft: PostDraft }>('/api/ai/writing/draft', { mode: 'post', ...opts }).then(
    d => d.draft
  );
}

/**
 * Draft a reply to someone else's post, grounded in that post + the user's own
 * context and voice. `intent` steers how it engages (add a point, ask, push back…).
 */
export function fetchReplyDraft(opts: {
  parentText: string;
  parentAuthor?: string;
  intent?: ReplyIntent;
}): Promise<PostDraft> {
  return postJson<{ draft: PostDraft }>('/api/ai/writing/draft', {
    mode: 'reply',
    ...opts,
  }).then(d => d.draft);
}

/**
 * Transform the author's own article text (improve / continue / tighten / expand
 * / grammar / tone) or seed an outline. Returns the revised markdown.
 */
export function reviseArticleText(opts: {
  action: ReviseAction;
  text?: string;
  tone?: TonePreset;
  title?: string;
  topic?: string;
  instruction?: string;
  /** 'post' for short timeline posts (short + length-clamped); default 'article'. */
  kind?: 'post' | 'article';
}): Promise<string> {
  return postJson<{ result: string }>('/api/ai/writing/revise', opts).then(d => d.result);
}

/** Suggest sharper headline options grounded in the article body. */
export function suggestArticleTitles(body: string): Promise<string[]> {
  return postJson<{ suggestions: string[] }>('/api/ai/writing/revise', {
    action: 'title',
    text: body,
  }).then(d => d.suggestions);
}

/** Generate a one-line excerpt/hook from the article body. */
export function generateArticleExcerpt(body: string, title?: string): Promise<string> {
  return postJson<{ result: string }>('/api/ai/writing/revise', {
    action: 'excerpt',
    text: body,
    title,
  }).then(d => d.result);
}
