/**
 * The record that a post or message has mentions still to process.
 *
 * Producers write here and return; the worker does the work. That split is what
 * keeps an LLM round trip out of the sender's POST, and what stops a dying
 * process from swallowing a question — the worst outcome for an assistant is a
 * request that vanishes with no reply and no error. The same durability is what
 * makes a missed `@alice` notification a retry rather than a loss.
 *
 * Every function here is idempotent or atomic at the database, not in
 * JavaScript: the unique key on (source_type, source_id) makes enqueueing
 * at-least-once safe, and `claim_mentions` uses FOR UPDATE SKIP LOCKED so an
 * inline run and a timer tick can work the same queue without answering the same
 * mention twice.
 */

import { logger } from '@/utils/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export const MENTION_QUEUE_TABLE = 'mention_queue';

/** How many times a mention is retried before it is abandoned as failed. */
export const MAX_ATTEMPTS = 3;

export type MentionSource = 'message' | 'timeline_event';

export interface EnqueueInput {
  sourceType: MentionSource;
  sourceId: string;
  requesterId: string;
  /** Set for a private message. Mutually exclusive with parentEventId. */
  conversationId?: string | null;
  /** Set for a wall post. Mutually exclusive with conversationId. */
  parentEventId?: string | null;
}

export interface ClaimedMention {
  id: string;
  source_type: MentionSource;
  source_id: string;
  requester_id: string;
  conversation_id: string | null;
  parent_event_id: string | null;
  attempts: number;
}

/**
 * Record that a source has mentions to process.
 *
 * @returns true when the debt is recorded — including when it was already
 *   recorded, because that is success, not failure. A duplicate insert is the
 *   expected outcome of an at-least-once producer, and the unique constraint is
 *   what makes it harmless.
 */
export async function enqueueMention(
  admin: SupabaseClient,
  input: EnqueueInput
): Promise<boolean> {
  const { error } = await admin.from(MENTION_QUEUE_TABLE).insert({
    source_type: input.sourceType,
    source_id: input.sourceId,
    requester_id: input.requesterId,
    conversation_id: input.conversationId ?? null,
    parent_event_id: input.parentEventId ?? null,
  });

  if (!error) {
    return true;
  }
  // 23505 = unique violation: this mention is already queued or already answered.
  if (error.code === '23505') {
    return true;
  }
  logger.error(
    'Could not queue a mention',
    { sourceType: input.sourceType, sourceId: input.sourceId, error: error.message },
    'MentionQueue'
  );
  return false;
}

/** Atomically take up to `limit` pending mentions, marking them running. */
export async function claimMentions(
  admin: SupabaseClient,
  limit: number
): Promise<ClaimedMention[]> {
  const { data, error } = await admin.rpc('claim_mentions', { p_limit: limit });
  if (error) {
    logger.error('Could not claim mentions', { error: error.message }, 'MentionQueue');
    return [];
  }
  return (data ?? []) as ClaimedMention[];
}

/** Mark a claimed mention answered. */
export async function completeMention(
  admin: SupabaseClient,
  id: string
): Promise<void> {
  await admin
    .from(MENTION_QUEUE_TABLE)
    .update({ status: 'done', finished_at: new Date().toISOString(), last_error: null })
    .eq('id', id);
}

/**
 * Record that an attempt failed.
 *
 * Returns the row to `pending` while attempts remain, so the next tick retries
 * it; abandons it as `failed` once they are exhausted. The error is kept either
 * way — a queue that discards why it gave up is a queue nobody can debug.
 */
export async function failMention(
  admin: SupabaseClient,
  mention: ClaimedMention,
  reason: string
): Promise<void> {
  const exhausted = mention.attempts >= MAX_ATTEMPTS;
  await admin
    .from(MENTION_QUEUE_TABLE)
    .update({
      status: exhausted ? 'failed' : 'pending',
      last_error: reason.slice(0, 500),
      finished_at: exhausted ? new Date().toISOString() : null,
    })
    .eq('id', mention.id);

  if (exhausted) {
    logger.error(
      'Gave up processing a mention',
      { id: mention.id, sourceId: mention.source_id, attempts: mention.attempts, reason },
      'MentionQueue'
    );
  }
}
