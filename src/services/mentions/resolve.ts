/**
 * Which handles in a piece of text are real people (and which is the Cat).
 *
 * The split is deliberate: `domain/mentions/parse.ts` decides what the text
 * COULD mean with no I/O, and this decides who those handles actually are with
 * exactly one query. Neither knows about HTTP, and neither is bolted onto the
 * Cat service — the Cat is resolved by the same code path as everybody else,
 * because it is an account like everybody else. One mention system, not two.
 */

import { collectMentionCandidates, parseMentionCandidates } from '@/domain/mentions/parse';
import { CAT_USERNAME } from '@/config/cat-identity';
import { DATABASE_TABLES } from '@/config/database-tables';
import { normalizeUsername } from '@/config/usernames';
import type { AnySupabaseClient } from '@/lib/supabase/types';

export interface ResolvedMention {
  /** Profile id of the mentioned account. */
  id: string;
  /** The handle as stored, which may differ in case from what was typed. */
  username: string;
  /** True when this is the Cat's own account. */
  isCat: boolean;
}

export interface MentionResolution {
  /** Every real account mentioned, deduped, in the order first mentioned. */
  mentions: ResolvedMention[];
  /** Convenience: was the Cat among them? */
  mentionsCat: boolean;
}

const EMPTY: MentionResolution = { mentions: [], mentionsCat: false };

/**
 * @param client any Supabase client — the caller decides whose permissions
 *   apply. Reading `profiles` is public, so a request-scoped client is fine and
 *   no admin client is needed.
 */
export async function resolveMentions(
  client: AnySupabaseClient,
  text: string
): Promise<MentionResolution> {
  const candidates = collectMentionCandidates(text);
  if (candidates.length === 0) {
    return EMPTY;
  }

  // One query for the whole message, not one per mention. `username` is unique
  // case-insensitively (profiles_username_lower_key), so lowercasing both sides
  // is a total match rather than a heuristic.
  const { data, error } = await client
    .from(DATABASE_TABLES.PROFILES)
    .select('id, username')
    .in('username_lower', candidates)
    .limit(candidates.length);

  if (error || !data) {
    return EMPTY;
  }

  const byHandle = new Map<string, { id: string; username: string }>();
  for (const row of data as Array<{ id: string; username: string }>) {
    byHandle.set(row.username.toLowerCase(), row);
  }

  const seen = new Set<string>();
  const mentions: ResolvedMention[] = [];

  for (const mention of parseMentionCandidates(text)) {
    // Longest candidate first: `@bob.smith` prefers bob.smith over bob.
    for (const candidate of mention.candidates) {
      const row = byHandle.get(candidate.toLowerCase());
      if (!row) {
        continue;
      }
      if (!seen.has(row.id)) {
        seen.add(row.id);
        mentions.push({
          id: row.id,
          username: row.username,
          isCat: normalizeUsername(row.username) === normalizeUsername(CAT_USERNAME),
        });
      }
      break;
    }
  }

  return { mentions, mentionsCat: mentions.some(m => m.isCat) };
}
