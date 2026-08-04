/**
 * Shared internal helpers for timeline event mutations. Extracted verbatim from
 * events.ts (SoC) and used by both events-create.ts and events.ts. No behavior change.
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { TIMELINE_TABLES } from '@/config/database-tables';
import type { TimelineEvent, TimelineEventDb } from '@/types/timeline';
import { mapDbEventToTimelineEvent } from '../formatters';

export async function resolveActorId(actorId?: string): Promise<string | null> {
  if (actorId) {
    return actorId;
  }
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    logger.error('Error getting current user ID', error, 'Timeline');
    return null;
  }
}

export function buildSafeTitle(title?: string, description?: string): string {
  return title?.trim() || description?.trim()?.slice(0, 140) || 'Update';
}

export async function fetchCreatedEvent(
  eventId: string,
  logMessage: string
): Promise<{ event: TimelineEvent | null }> {
  const { data, error } = await supabase
    .from(TIMELINE_TABLES.EVENTS)
    .select('*')
    .eq('id', eventId)
    .single();
  if (error || !data) {
    logger.error(logMessage, error, 'Timeline');
    return { event: null };
  }
  // `TimelineEventDb` is the app's view of a `timeline_events` row: same
  // columns, with the jsonb payloads given their parsed shape.
  return { event: mapDbEventToTimelineEvent(data as unknown as TimelineEventDb) };
}

/**
 * Handle post-creation hooks (notifications, webhooks, etc.)
 * This is a placeholder for future functionality
 */
export async function handlePostCreationHooks(event: TimelineEvent): Promise<void> {
  // Placeholder for post-creation hooks
  // Could trigger notifications, webhooks, analytics, etc.
  logger.debug('Post creation hook triggered', { eventId: event.id }, 'Timeline');
}
