/**
 * Turn an article into concrete image SEARCH TERMS. The value the AI adds here
 * is translation: an article about "sovereignty and self-hosting" doesn't search
 * well, but "server room", "lighthouse", "open road" do. Pure LLM (no DB) so it
 * works even when the rest of the platform can't reach the database. Never throws.
 */

import { callPlatformJson, parseJsonLoose } from '@/services/cat/platform-llm';

const MAX_QUERIES = 6;

/**
 * Fallback when the model is unavailable: the longest words from the title make
 * a serviceable-if-blunt search. Better than nothing; keeps the picker useful.
 */
function fallbackQueries(title: string): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
  return words.slice(0, 3);
}

export async function suggestImageQueries(title: string, body: string): Promise<string[]> {
  const cleanTitle = title.trim().slice(0, 200);
  const cleanBody = body.trim().slice(0, 2000);
  if (!cleanTitle && !cleanBody) {
    return [];
  }

  const system = `You suggest IMAGE SEARCH TERMS to illustrate an article — a cover photo and inline images.

Rules:
- Return ${MAX_QUERIES} short queries, each 1–3 words.
- CONCRETE and VISUAL: real objects, scenes, places, materials (e.g. "server room", "open road", "hands soldering", "mountain lake"). A stock-photo library must return real photos for it.
- NOT abstract nouns ("freedom", "sovereignty", "innovation") — translate the idea into something photographable.
- Order from most to least on-topic.

Output ONLY JSON: {"queries":["...","..."]}.`;

  const user = `Article title: ${cleanTitle || '(none)'}

Article body (excerpt):
${cleanBody || '(none)'}

Return the search terms as JSON.`;

  const raw = await callPlatformJson(system, user, { temperature: 0.7, maxTokens: 300 });
  const parsed = parseJsonLoose<{ queries?: unknown }>(raw);
  const arr = Array.isArray(parsed?.queries) ? parsed.queries : [];
  const queries = arr
    .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
    .map(q =>
      q
        .trim()
        .replace(/^["']|["']$/g, '')
        .slice(0, 60)
    )
    .slice(0, MAX_QUERIES);

  return queries.length ? queries : fallbackQueries(cleanTitle);
}
