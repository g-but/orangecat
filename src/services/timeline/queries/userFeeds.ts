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

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { TIMELINE_TABLES } from '@/config/database-tables';
import type {
  TimelineFeedResponse,
  TimelineDisplayEvent,
  TimelineFilters,
  TimelinePagination,
} from '@/types/timeline';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants';
import { getCurrentUserId, transformEnrichedEventToDisplay } from './helpers';
import { getDateRangeFilter, buildDefaultFilters } from '@/services/timeline/formatters/filters';
import { enrichEventsForDisplay, getActorInfo, getSubjectInfo } from '@/services/timeline/processors/enrichment';
import { mapDbEventToTimelineEvent, getEventIcon, getEventColor, getEventDisplayType, formatAmount, getTimeAgo, isEventRecent } from '@/services/timeline/formatters';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.rpc as any)('get_user_timeline_feed', {
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
      query = query
        .gte('event_timestamp', dateFilter.start)
        .lte('event_timestamp', dateFilter.end);
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

    // Get total count
    const { count } = await supabase
      .from(TIMELINE_TABLES.EVENTS)
      .select('*', { count: 'exact', head: true })
      .eq('actor_id', userId)
      .eq('is_deleted', false);

    const totalEvents = count || 0;

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

    // Get list of followed user IDs
    const { data: follows, error: followsError } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('user_follows') as any)
      .select('followed_user_id')
      .eq('follower_id', currentUserId)
      .eq('is_active', true);

    if (followsError) {
      logger.error('Failed to fetch followed users', followsError, 'Timeline');
      throw followsError;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const followedUserIds = (follows as any[])?.map((f: any) => f.followed_user_id) || [];

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
      query = query
        .gte('event_timestamp', dateFilter.start)
        .lte('event_timestamp', dateFilter.end);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDemoTimelineEvents?: (userId: string) => any[]
): Promise<TimelineFeedResponse> {
  try {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let events: any[] = [];
    let totalEvents = 0;

    try {
      const {
        data: enrichedEvents,
        error,
        count,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } = await (supabase.rpc as any)('get_enriched_timeline_feed', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        logger.warn(
          'Enriched timeline feed not available, falling back to basic feed',
          error,
          'Timeline'
        );

        // Fallback to basic timeline feed if enriched version isn't available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: basicEvents, error: basicError } = await (supabase.rpc as any)(
          'get_user_timeline_feed',
          {
            p_user_id: userId,
            p_limit: limit,
            p_offset: offset,
          }
        );

        if (basicError) {
          logger.warn(
            'Basic timeline feed also not available, using empty feed',
            basicError,
            'Timeline'
          );
          events = [];
          totalEvents = 0;
        } else {
          // Convert basic events to enriched format
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          events = ((basicEvents || []) as any[]).map((event: any) => ({
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
      } else {
        events = enrichedEvents || [];
        totalEvents = count || 0;
      }
    } catch (dbError) {
      logger.warn(
        'Database functions not available, returning demo timeline',
        dbError,
        'Timeline'
      );
      // Return demo data so the UI works even without database
      if (getDemoTimelineEvents) {
        events = getDemoTimelineEvents(userId);
        totalEvents = events.length;
      } else {
        events = [];
        totalEvents = 0;
      }
    }

    // Transform to display events with social data
    const displayEvents = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (events || []).map(async (event: any) => {
        const timelineEvent = mapDbEventToTimelineEvent(event);

        // Enrich with actor info
        const actor = await getActorInfo(timelineEvent.actorId);
        const subject = timelineEvent.subjectId
          ? await getSubjectInfo(timelineEvent.subjectType, timelineEvent.subjectId)
          : undefined;
        const target = timelineEvent.targetId
          ? await getSubjectInfo(timelineEvent.targetType!, timelineEvent.targetId)
          : undefined;

        // Omit eventType and eventSubtype as TimelineDisplayEvent extends Omit<TimelineEvent, 'eventType' | 'eventSubtype'>
        const { eventType: _eventType, eventSubtype: _eventSubtype, ...eventWithoutTypes } = timelineEvent;

        return {
          ...eventWithoutTypes,
          icon: getEventIcon(timelineEvent.eventType),
          iconColor: getEventColor(timelineEvent.eventType),
          displayType: getEventDisplayType(timelineEvent.eventType),
          displaySubtype: timelineEvent.eventSubtype,
          actor,
          subject,
          target,
          formattedAmount: formatAmount(timelineEvent),
          timeAgo: getTimeAgo(timelineEvent.eventTimestamp),
          isRecent: isEventRecent(timelineEvent.eventTimestamp),
          // Social interaction data
          likesCount: event.like_count || 0,
          sharesCount: event.share_count || 0,
          commentsCount: event.comment_count || 0,
          userLiked: event.user_liked || false,
          userShared: event.user_shared || false,
          userCommented: event.user_commented || false,
        } as TimelineDisplayEvent;
      })
    );

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

