/**
 * Timeline Filter Utilities
 * 
 * Helper functions for building and applying timeline filters.
 * 
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted filter logic from monolithic timeline service
 */

import type { TimelineFilters } from '@/types/timeline';

/**
 * Get date range filter
 */
export function getDateRangeFilter(dateRange: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();

  switch (dateRange) {
    case 'today':
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      return { start: today.toISOString(), end };
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return { start: weekAgo.toISOString(), end };
    case 'month':
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return { start: monthAgo.toISOString(), end };
    case 'year':
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      return { start: yearAgo.toISOString(), end };
    default:
      const yearAgoDefault = new Date(now);
      yearAgoDefault.setFullYear(now.getFullYear() - 1);
      return { start: yearAgoDefault.toISOString(), end };
  }
}

/**
 * Build default filters with partial override
 */
export function buildDefaultFilters(partialFilters?: Partial<TimelineFilters>): TimelineFilters {
  return {
    eventTypes: [],
    dateRange: 'all',
    visibility: ['public', 'followers'],
    actors: [],
    subjects: [],
    tags: [],
    ...partialFilters,
  };
}



