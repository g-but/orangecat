/**
 * Event Queries
 *
 * Handles individual event queries:
 * - Get event by ID
 * - Get replies to an event
 * - Search posts
 * - Get thread posts
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from feeds.ts
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { TIMELINE_TABLES } from '@/config/database-tables';
import type {
  TimelineDisplayEvent,
  TimelineEventType,
  TimelineActorType,
} from '@/types/timeline';
import { transformEnrichedEventToDisplay } from './helpers';
import { enrichEventsForDisplay } from '@/services/timeline/processors/enrichment';
import { getTimeAgo, isEventRecent } from '@/services/timeline/formatters';

/**
 * Get event by ID
 */
export async function getEventById(eventId: string): Promise<{ success: boolean; event?: TimelineDisplayEvent; error?: string }> {
  try {
    // Try enriched view first
    const { data: event, error } = await supabase
      .from(TIMELINE_TABLES.ENRICHED_VIEW)
      .select('*')
      .eq('id', eventId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      // Fallback to raw table
      const { data: rawEvent, error: rawError } = await supabase
        .from(TIMELINE_TABLES.EVENTS)
        .select('*')
        .eq('id', eventId)
        .eq('is_deleted', false)
        .single();

      if (rawError || !rawEvent) {
        return { success: false, error: 'Event not found' };
      }

      const enriched = await enrichEventsForDisplay([rawEvent]);
      return { success: true, event: enriched[0] };
    }

    const enriched = await enrichEventsForDisplay([event]);
    return { success: true, event: enriched[0] };
  } catch (error) {
    logger.error('Error fetching event by ID', error, 'Timeline');
    return { success: false, error: 'Failed to fetch event' };
  }
}

/**
 * Get replies to a specific event (thread-friendly, uses parent_event_id)
 * Builds a small reply tree to enable nested replies in the UI.
 */
export async function getReplies(
  eventId: string,
  limit: number = 50
): Promise<{ success: boolean; replies?: TimelineDisplayEvent[]; error?: string }> {
  try {
    const buildTree = async (
      parentId: string,
      depth: number
    ): Promise<TimelineDisplayEvent[]> => {
      // Limit depth to avoid accidental cycles
      if (depth > 3) {
        return [];
      }

      const { data: childEvents, error } = await supabase
        .from(TIMELINE_TABLES.EVENTS)
        .select('*')
        .eq('parent_event_id', parentId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(depth === 0 ? limit : 50);

      if (error) {
        logger.error('Error fetching replies', error, 'Timeline');
        return [];
      }

      const enrichedChildren = await enrichEventsForDisplay(childEvents || []);

      // Recursively fetch children for each reply
      const withNested = [];
      for (const reply of enrichedChildren) {
        const nestedReplies = await buildTree(reply.id, depth + 1);
        withNested.push({
          ...reply,
          replies: nestedReplies,
          replyCount: nestedReplies.length,
        });
      }

      return withNested;
    };

    const replies = await buildTree(eventId, 0);
    return { success: true, replies };
  } catch (error) {
    logger.error('Error fetching replies', error, 'Timeline');
    return { success: false, error: 'Failed to fetch replies' };
  }
}

/**
 * Search posts by query string
 * Searches in title, description, and actor names
 */
export async function searchPosts(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{
  success: boolean;
  posts?: TimelineDisplayEvent[];
  total?: number;
  error?: string;
}> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: false, error: 'Search query must be at least 2 characters' };
    }

    const searchQuery = query.trim().toLowerCase();
    const limit = Math.min(options?.limit || 20, 50);
    const offset = options?.offset || 0;

    // Search in enriched_timeline_events view
    // Using ilike for case-insensitive search
    const { data: events, error, count } = await supabase
      .from(TIMELINE_TABLES.ENRICHED_VIEW)
      .select('*', { count: 'exact' })
      .eq('visibility', 'public')
      .eq('is_deleted', false)
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .order('event_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Search query failed', error, 'Timeline');
      return { success: false, error: 'Search failed. Please try again.' };
    }

    // Transform to display events
    const displayEvents = (events || []).map(transformEnrichedEventToDisplay);

    return {
      success: true,
      posts: displayEvents,
      total: count || 0,
    };
  } catch (error) {
    logger.error('Error searching posts', error, 'Timeline');
    return { success: false, error: 'Search failed. Please try again.' };
  }
}

/**
 * Get all posts in a thread
 */
export async function getThreadPosts(threadId: string): Promise<{
  success: boolean;
  posts?: TimelineDisplayEvent[];
  total?: number;
  error?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (supabase.rpc as any)('get_thread_posts', {
      p_thread_id: threadId,
      p_limit: 50,
      p_offset: 0,
    });

    if (result.error) {
      logger.error('Failed to get thread posts', result.error, 'Timeline');
      return { success: false, error: result.error.message };
    }

    if (!result.data || result.data.length === 0) {
      return { success: true, posts: [], total: 0 };
    }

    // Type for RPC result row
    interface ThreadPostRow {
      id: string;
      event_type: string;
      actor_id: string;
      actor_name?: string;
      actor_username?: string;
      actor_avatar?: string;
      event_timestamp: string;
      parent_event_id?: string;
      thread_id?: string;
      thread_depth?: number;
      is_quote_reply?: boolean;
      metadata?: Record<string, unknown>;
      [key: string]: unknown;
    }

    // Convert to display events - cast to satisfy TimelineDisplayEvent requirements
    // RPC returns partial data that gets enriched later in the UI
    const displayEvents = (result.data as ThreadPostRow[]).map((event: ThreadPostRow) => ({
      ...event,
      eventType: event.event_type as TimelineEventType,
      actor: {
        id: event.actor_id,
        name: event.actor_name || 'Unknown',
        username: event.actor_username,
        avatar: event.actor_avatar,
        type: 'user' as TimelineActorType,
      },
      timeAgo: getTimeAgo(event.event_timestamp),
      isRecent: isEventRecent(event.event_timestamp),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      userLiked: false,
      userShared: false,
      userCommented: false,
      parentPostId: event.parent_event_id,
      threadId: event.thread_id,
      threadDepth: event.thread_depth,
      isQuoteReply: event.is_quote_reply || false,
      quotedContent: (event.metadata as { quoted_content?: string })?.quoted_content,
    })) as unknown as TimelineDisplayEvent[];

    return {
      success: true,
      posts: displayEvents,
      total: result.data.length,
    };
  } catch (error) {
    logger.error('Error getting thread posts', error, 'Timeline');
    return { success: false, error: 'Failed to load thread. Please try again.' };
  }
}

