/**
 * Profile Feed Queries
 *
 * Handles profile-related timeline feed queries.
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
  TimelineFilters,
  TimelinePagination,
} from '@/types/timeline';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants';
import { transformEnrichedEventToDisplay } from './helpers';
import { buildDefaultFilters } from '@/services/timeline/formatters/filters';

/**
 * Get profile timeline feed
 */
export async function getProfileFeed(
  profileId: string,
  filters?: Partial<TimelineFilters>,
  pagination?: Partial<TimelinePagination>
): Promise<TimelineFeedResponse> {
  try {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * limit;

    const {
      data: events,
      error,
      count,
    } = await supabase
      .from(TIMELINE_TABLES.ENRICHED_VIEW)
      .select('*', { count: 'exact' })
      .or(`actor_id.eq.${profileId},and(subject_type.eq.profile,subject_id.eq.${profileId})`)
      .order('event_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch profile timeline feed', error, 'Timeline');
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
    logger.error('Error fetching profile timeline feed', error, 'Timeline');
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

