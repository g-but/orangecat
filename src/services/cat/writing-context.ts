/**
 * Shared grounding + context-building for every AI writing feature (topic
 * suggestions, drafts, and in-editor revisions). Extracted so the draft engine
 * and the revise engine ground on the SAME real user context and obey the SAME
 * hard rules — one source of truth for "what the AI knows and may not fabricate".
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { fetchFullContextForCat } from '@/services/ai/document-context';
import { buildFullContextString } from '@/services/ai/context-string-builder';
import { getUserActorId } from '@/domain/actors';
import { TIMELINE_TABLES } from '@/config/database-tables';
import { listMemories } from './memory';

export const GROUNDING_RULES = `GROUNDING RULES (hard constraints):
- Ground everything in something SPECIFIC and REAL from the context provided (their work, skills, entities, stated interests, or the posts they've already written).
- NEVER invent facts, statistics, quotes, events, or people. If the context is thin, write about the themes that ARE present rather than fabricating detail.
- Write in the user's own voice — match the tone of the posts they've already written when samples are provided.
- Money is Bitcoin (BTC) or a fiat currency; NEVER write "sats" or "satoshis".
- No clichés, no clickbait, no hashtag spam, no corporate filler. Sound like a real, thoughtful person.`;

/** The last posts/articles the user authored — their voice, for tone-matching. */
export async function fetchRecentAuthored(
  supabase: AnySupabaseClient,
  actorId: string
): Promise<string> {
  try {
    const { data } = await supabase
      .from(TIMELINE_TABLES.EVENTS)
      .select('title, description, metadata')
      .eq('actor_id', actorId)
      .eq('metadata->>is_user_post', 'true')
      .eq('is_deleted', false)
      .order('event_timestamp', { ascending: false })
      .limit(20);

    const rows = (data ?? []) as Array<{
      title: string | null;
      description: string | null;
      metadata: { is_article?: boolean } | null;
    }>;
    const lines = rows
      .map(r => {
        const text = (r.description || r.title || '').replace(/\s+/g, ' ').trim().slice(0, 200);
        if (!text) {
          return '';
        }
        return `- ${r.metadata?.is_article ? '[article] ' : ''}${text}`;
      })
      .filter(Boolean);
    return lines.length ? lines.join('\n') : '(none yet)';
  } catch {
    return '(none yet)';
  }
}

export interface WriterContext {
  contextBlob: string;
  memoryBlob: string;
  recentBlob: string;
}

/**
 * Full context — profile, entities, durable memories, and voice samples. Used
 * for open-ended generation (topics, full drafts) where the AI needs to know
 * what the person is about.
 */
export async function buildWriterContext(
  supabase: AnySupabaseClient,
  userId: string
): Promise<WriterContext> {
  const [context, memories, actorId] = await Promise.all([
    fetchFullContextForCat(supabase, userId),
    listMemories(supabase, userId),
    getUserActorId(supabase, userId),
  ]);
  const contextBlob = buildFullContextString(context);
  const memoryBlob = memories.length
    ? memories
        .slice(0, 40)
        .map(m => `- ${m.content}`)
        .join('\n')
    : '(none)';
  const recentBlob = actorId ? await fetchRecentAuthored(supabase, actorId) : '(none yet)';
  return { contextBlob, memoryBlob, recentBlob };
}

/**
 * Voice-only context — just the user's recent posts. Used for in-editor
 * revisions (improve, tighten, continue…) where the AI is transforming text the
 * user already wrote and only needs their tone, not their whole world model.
 * One query instead of three — revisions stay fast.
 */
export async function buildVoiceContext(
  supabase: AnySupabaseClient,
  userId: string
): Promise<{ recentBlob: string }> {
  const actorId = await getUserActorId(supabase, userId);
  const recentBlob = actorId ? await fetchRecentAuthored(supabase, actorId) : '(none yet)';
  return { recentBlob };
}

export function contextPrompt(ctx: WriterContext, focus?: string): string {
  return `Everything OrangeCat knows about this user:

${ctx.contextBlob}

DURABLE MEMORIES:
${ctx.memoryBlob}

POSTS THEY'VE ALREADY WRITTEN (their voice — match this tone):
${ctx.recentBlob}
${focus ? `\nThe user asked to focus on: ${focus}\n` : ''}`;
}
