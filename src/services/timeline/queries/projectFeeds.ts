/**
 * Project Feed Queries
 *
 * Handles project-related timeline feed queries:
 * - Project timeline feed
 * - Project timeline (simplified)
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
import { buildDefaultFilters } from '@/services/timeline/formatters/filters';

/**
 * Get project timeline feed
 */
export async function getProjectFeed(
  projectId: string,
  filters?: Partial<TimelineFilters>,
  pagination?: Partial<TimelinePagination>
): Promise<TimelineFeedResponse> {
  try {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * limit;

    const currentUserId = await getCurrentUserId();
    const {
      data: events,
      error,
      count,
    } = await supabase
      .from(TIMELINE_TABLES.ENRICHED_VIEW)
      .select('*', { count: 'exact' })
      .eq('subject_type', 'project')
      .eq('subject_id', projectId)
      .or(`visibility.eq.public,actor_id.eq.${currentUserId}`)
      .order('event_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch project timeline feed', error, 'Timeline');
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
    logger.error('Error fetching project timeline feed', error, 'Timeline');
    // Return empty feed instead of throwing
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
}

/**
 * Get project timeline (simplified version)
 */
export async function getProjectTimeline(projectId: string, limit: number = 50): Promise<TimelineDisplayEvent[]> {
  try {
    const feed = await getProjectFeed(projectId, {}, { limit });
    return feed.events;
  } catch (error) {
    logger.error('Error fetching project timeline', error, 'Timeline');
    return [];
  }
}

