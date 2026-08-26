/**
 * Writing a timeline reply as a trusted server caller.
 *
 * The same split as features/messaging/server/write-message.ts, for the same
 * reason. `create_timeline_event` re-imposes the RLS actor check by hand —
 * `v_actor_id IS DISTINCT FROM auth.uid()` raises "Actor mismatch" — which is
 * exactly right when a browser calls it, and impossible for the Cat: a worker
 * has no `auth.uid()` at all, so every Cat reply would raise.
 *
 * Relaxing that check is not an option; it is the only thing standing between
 * one authenticated user and posting as another. So authorization stays there
 * for callers that have a session, and this exists for callers that have
 * already established authority some other way — which is why it takes an admin
 * client explicitly instead of creating one.
 */

import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface WriteTimelineReplyInput {
  parentEventId: string;
  actorId: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/** @returns the new event id, or null if it could not be written. */
export async function writeTimelineReply(
  admin: SupabaseClient,
  input: WriteTimelineReplyInput
): Promise<string | null> {
  const { data: parent } = await admin
    .from(DATABASE_TABLES.TIMELINE_EVENTS)
    .select('id, thread_id, thread_depth, visibility')
    .eq('id', input.parentEventId)
    .maybeSingle();

  if (!parent) {
    logger.warn('Cannot reply to a post that is not there', { id: input.parentEventId }, 'TimelineWrite');
    return null;
  }

  const parentRow = parent as {
    id: string;
    thread_id: string | null;
    thread_depth: number | null;
    visibility: string | null;
  };

  const title = input.description.slice(0, 140) || 'Update';
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from(DATABASE_TABLES.TIMELINE_EVENTS)
    .insert({
      event_type: 'status_update',
      actor_id: input.actorId,
      actor_type: 'user',
      subject_type: 'profile',
      subject_id: input.actorId,
      title,
      description: input.description,
      content: { text: input.description },
      // A reply inherits its parent's audience. Answering a followers-only post
      // in public would republish the question to people who could not see it.
      visibility: parentRow.visibility ?? 'public',
      metadata: input.metadata ?? {},
      parent_event_id: parentRow.id,
      thread_id: parentRow.thread_id ?? parentRow.id,
      thread_depth: (parentRow.thread_depth ?? 0) + 1,
      event_timestamp: now,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (error || !data) {
    logger.error('Failed to write a timeline reply', { error: error?.message }, 'TimelineWrite');
    return null;
  }

  const eventId = (data as { id: string }).id;

  // Without a visibility row the reply exists and appears on nobody's timeline —
  // the same trap create_post_with_visibility exists to avoid.
  const { error: visError } = await admin
    .from('timeline_event_visibility')
    .insert({ event_id: eventId, timeline_type: 'profile', timeline_owner_id: input.actorId });

  if (visError) {
    logger.warn('Cat reply written but not routed to a timeline', { eventId, error: visError.message }, 'TimelineWrite');
  }

  return eventId;
}
