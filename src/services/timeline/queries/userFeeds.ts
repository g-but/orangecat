/**
 * User Feed Queries
 *
 * Handles user-related timeline feed queries:
 * - User's personal timeline feed
 * - Followed users feed
 * - Enriched user feed
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from feeds.ts
 */

import { callRpc } from '@/lib/supabase/untyped';
import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES, TIMELINE_TABLES } from '@/config/database-tables';
import type {
  TimelineFeedResponse,
  TimelineDisplayEvent,
  TimelineFilters,
  TimelinePagination,
} from '@/types/timeline';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants';
import { getCurrentUserId, transformEnrichedEventToDisplay } from './helpers';
import { getDateRangeFilter, buildDefaultFilters } from '@/services/timeline/formatters/filters';
import { enrichEventsForDisplay } from '@/services/timeline/processors/enrichment';

/**
 * Get user's personalized timeline feed
 */
export async function getUserFeed(
  userId: string,
  filters?: Partial<TimelineFilters>,
  pagination?: Partial<TimelinePagination>
): Promise<TimelineFeedResponse> {
  try {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * limit;

    // Build filter conditions

    let query = callRpc(supabase, 'get_user_timeline_feed', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset,
    });

    // Apply additional filters
    if (filters?.eventTypes?.length) {
      query = query.in('event_type', filters.eventTypes);
    }

    if (filters?.dateRange && filters.dateRange !== 'all') {
      const dateFilter = getDateRangeFilter(filters.dateRange);
      query = query.gte('event_timestamp', dateFilter.start).lte('event_timestamp', dateFilter.end);
    }

    if (filters?.visibility?.length) {
      query = query.in('visibility', filters.visibility);
    }

    const { data: events, error } = await query;

    if (error) {
      logger.error('Failed to fetch timeline feed', error, 'Timeline');
      throw error;
    }

    // Transform to display events
    const displayEvents = await enrichEventsForDisplay(events || []);

    // Total count: use the RPC with count option (it resolves user→actor internally)

    const { count } = await callRpc(
      supabase,
      'get_user_timeline_feed',
      {
        p_user_id: userId,
        p_limit: 0,
        p_offset: 0,
      },
      { count: 'exact', head: true }
    );

    const totalEvents = count || displayEvents.length;

    return {
      events: displayEvents,
      pagination: {
        page,
        limit,
        total: totalEvents,
        hasNext: offset + limit < totalEvents,
        hasPrev: page > 1,
      },
      filters: buildDefaultFilters(filters),
      metadata: {
        totalEvents,
        featuredEvents: displayEvents.filter(e => e.isFeatured).length,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('Error fetching user timeline feed', error, 'Timeline');
    // Return empty feed instead of throwing - error is logged for debugging
    return {
      events: [],
      pagination: {
        page: pagination?.page || 1,
        limit: pagination?.limit || DEFAULT_PAGE_SIZE,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
      filters: buildDefaultFilters(filters),
      metadata: {
        totalEvents: 0,
        featuredEvents: 0,
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}

/**
 * Get feed of events from users the current user follows
 */
export async function getFollowedUsersFeed(
  filters?: Partial<TimelineFilters>,
  pagination?: Partial<TimelinePagination>
): Promise<TimelineFeedResponse> {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        events: [],
        pagination: {
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
          total: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: buildDefaultFilters(filters),
        metadata: {
          totalEvents: 0,
          featuredEvents: 0,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * limit;

    // Get list of followed user IDs. The follows table's canonical columns are
    // follower_id / following_id — there is no followed_user_id or is_active
    // column (selecting them 400s and silently empties this feed).
    const { data: follows, error: followsError } = await supabase
      .from(DATABASE_TABLES.FOLLOWS)
      .select('following_id')
      .eq('follower_id', currentUserId);

    if (followsError) {
      logger.error('Failed to fetch followed users', followsError, 'Timeline');
      throw followsError;
    }

    const followedUserIds =
      (follows as { following_id: string }[] | null)?.map(f => f.following_id) || [];

    if (followedUserIds.length === 0) {
      return {
        events: [],
        pagination: {
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
          total: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: buildDefaultFilters(filters),
        metadata: {
          totalEvents: 0,
          featuredEvents: 0,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    // Build query for events from followed users
    let query = supabase
      .from(TIMELINE_TABLES.ENRICHED_VIEW)
      .select('*', { count: 'exact' })
      .in('actor_id', followedUserIds)
      .eq('is_deleted', false)
      .order('event_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters?.eventTypes?.length) {
      query = query.in('event_type', filters.eventTypes);
    }

    if (filters?.dateRange && filters.dateRange !== 'all') {
      const dateFilter = getDateRangeFilter(filters.dateRange);
      query = query.gte('event_timestamp', dateFilter.start).lte('event_timestamp', dateFilter.end);
    }

    if (filters?.visibility?.length) {
      query = query.in('visibility', filters.visibility);
    } else {
      // Default to public events for followed users feed
      query = query.eq('visibility', 'public');
    }

    const { data: events, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch followed users feed', error, 'Timeline');
      throw error;
    }

    // Transform enriched VIEW data to display events
    const displayEvents = (events || []).map(transformEnrichedEventToDisplay);

    return {
      events: displayEvents,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1,
      },
      filters: buildDefaultFilters(filters),
      metadata: {
        totalEvents: count || 0,
        featuredEvents: displayEvents.filter(e => e.isFeatured).length,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('Error fetching followed users feed', error, 'Timeline');
    // Return empty feed instead of throwing - error is logged for debugging
    return {
      events: [],
      pagination: {
        page: pagination?.page || 1,
        limit: pagination?.limit || DEFAULT_PAGE_SIZE,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
      filters: buildDefaultFilters(filters),
      metadata: {
        totalEvents: 0,
        featuredEvents: 0,
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}

/**
 * Get enriched timeline feed with social interactions
 */
export async function getEnrichedUserFeed(
  userId: string,
  filters?: Partial<TimelineFilters>,
  pagination?: Partial<TimelinePagination>,
  getDemoTimelineEvents?: (userId: string) => Record<string, unknown>[],
  // Which feed RPC to call. Default = the journey feed (own + followed + public).
  // Pass 'get_following_feed' for the true home feed (own + followed only).
  rpcName: 'get_user_timeline_feed' | 'get_following_feed' = 'get_user_timeline_feed'
): Promise<TimelineFeedResponse> {
  try {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * limit;

    let events: Record<string, unknown>[] = [];
    let totalEvents = 0;

    try {
      // The DB only has get_user_timeline_feed today — the "enriched" variant
      // was never created, so calling it just generated a 404 on every
      // dashboard load and then fell through to this same basic-feed code
      // path. Skip the broken probe and call the basic feed directly; the
      // enrichment fields below default to zero, matching what the previous
      // fallback emitted. If get_enriched_timeline_feed is added later,
      // restore the original ladder.

      const { data: basicEvents, error: basicError } = await callRpc(supabase, rpcName, {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
      });

      if (basicError) {
        logger.warn('Basic timeline feed not available, using empty feed', basicError, 'Timeline');
        events = [];
        totalEvents = 0;
      } else {
        events = ((basicEvents || []) as Record<string, unknown>[]).map(event => ({
          ...event,
          like_count: 0,
          share_count: 0,
          comment_count: 0,
          user_liked: false,
          user_shared: false,
          user_commented: false,
        }));
        totalEvents = events.length;
      }
    } catch (dbError) {
      logger.warn('Database functions not available, returning demo timeline', dbError, 'Timeline');
      // Return demo data so the UI works even without database
      if (getDemoTimelineEvents) {
        events = getDemoTimelineEvents(userId);
        totalEvents = events.length;
      } else {
        events = [];
        totalEvents = 0;
      }
    }

    // Transform to display events with social data. Enrichment is batched
    // (3 queries total) instead of up to 3 lookups per event — see
    // processors/enrichment.ts. Batch output preserves input order, so the
    // social counters can be zipped back in by index.
    const enrichedEvents = await enrichEventsForDisplay(events || []);
    const displayEvents = enrichedEvents.map((displayEvent, index) => {
      const event = (events || [])[index] as Record<string, unknown>;
      return {
        ...displayEvent,
        // Social interaction data
        likesCount: event.like_count || 0,
        sharesCount: event.share_count || 0,
        commentsCount: event.comment_count || 0,
        userLiked: event.user_liked || false,
        userShared: event.user_shared || false,
        userCommented: event.user_commented || false,
      } as TimelineDisplayEvent;
    });

    return {
      events: displayEvents,
      pagination: {
        page,
        limit,
        total: totalEvents,
        hasNext: offset + limit < totalEvents,
        hasPrev: page > 1,
      },
      filters: buildDefaultFilters(filters),
      metadata: {
        totalEvents,
        featuredEvents: displayEvents.filter(e => e.isFeatured).length,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('Error fetching enriched user timeline feed', error, 'Timeline');
    // Return empty feed instead of throwing - error is logged for debugging
    return {
      events: [],
      pagination: {
        page: pagination?.page || 1,
        limit: pagination?.limit || DEFAULT_PAGE_SIZE,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
      filters: buildDefaultFilters(filters),
      metadata: {
        totalEvents: 0,
        featuredEvents: 0,
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}

/**
 * Home feed — posts from people/projects the user FOLLOWS (plus their own),
 * excluding the public-everyone firehose. The true "Twitter home" feed, distinct
 * from the journey feed (getEnrichedUserFeed) and /community (getCommunityFeed).
 */
export async function getEnrichedFollowingFeed(
  userId: string,
  filters?: Partial<TimelineFilters>,
  pagination?: Partial<TimelinePagination>
): Promise<TimelineFeedResponse> {
  return getEnrichedUserFeed(userId, filters, pagination, undefined, 'get_following_feed');
}
