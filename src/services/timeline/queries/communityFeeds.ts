/**
 * Community Feed Queries
 *
 * Handles community-related timeline feed queries:
 * - Public community timeline feed
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from feeds.ts
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { withApiRetry } from '@/utils/retry';
import type {
  TimelineFeedResponse,
  TimelineFilters,
  TimelinePagination,
} from '@/types/timeline';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants';
import { transformEnrichedEventToDisplay } from './helpers';
import { buildDefaultFilters } from '@/services/timeline/formatters/filters';

/**
 * Get public community timeline (posts from all users and projects)
 * Uses community_timeline_no_duplicates VIEW to eliminate duplicate cross-posts
 */
export async function getCommunityFeed(
  filters?: Partial<TimelineFilters>,
  pagination?: Partial<TimelinePagination>
): Promise<TimelineFeedResponse> {
  try {
    return await withApiRetry(async () => {
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
      const offset = (page - 1) * limit;

      // Query community timeline view (NO DUPLICATES!)
      const {
        data: enrichedEvents,
        error,
        count,
      } = await supabase
        .from(TIMELINE_TABLES.COMMUNITY_VIEW)
        .select('*', { count: 'exact' })
        .order('event_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Failed to fetch community feed from enriched VIEW', error, 'Timeline');
        throw error;
      }

      // Transform enriched VIEW data to display events (no N+1 queries needed!)
      const displayEvents = (enrichedEvents || []).map(transformEnrichedEventToDisplay);

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
    }, { maxAttempts: 2, baseDelay: 500 }); // Quick retry for feed loading
  } catch (error) {
    logger.error('Error fetching community timeline feed', error, 'Timeline');
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

