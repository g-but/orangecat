/**
 * useSocialTimeline Hook
 *
 * Manages social timeline state, loading, searching, and sorting.
 * Extracted from SocialTimeline for better separation of concerns.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { timelineService } from '@/services/timeline';
import { TimelineDisplayEvent, TimelineFeedResponse } from '@/types/timeline';
import { logger } from '@/utils/logger';
import { filterOptimisticEvents } from '@/utils/timeline';
import { useInvalidateTimeline } from '@/hooks/useTimelineQuery';

export interface UseSocialTimelineProps {
  mode: 'timeline' | 'community';
  defaultSort?: 'recent' | 'trending' | 'popular';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOptimisticUpdate?: (event: any) => void;
}

export function useSocialTimeline({
  mode,
  defaultSort = 'trending',
  onOptimisticUpdate,
}: UseSocialTimelineProps) {
  const { user, isLoading, hydrated } = useAuth();
  const authCheckComplete = hydrated && !isLoading;

  const { invalidateAll: invalidateTimelineCache } = useInvalidateTimeline();
  const [timelineFeed, setTimelineFeed] = useState<TimelineFeedResponse | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [optimisticEvents, setOptimisticEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'popular'>(defaultSort);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TimelineDisplayEvent[] | null>(null);
  const [searchTotal, setSearchTotal] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const isSearchActive = searchResults !== null;

  // Handle optimistic event updates
  const handleOptimisticUpdate = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any) => {
      setOptimisticEvents(prev => [event, ...prev]);
      onOptimisticUpdate?.(event);
    },
    [onOptimisticUpdate]
  );

  // Merge optimistic events with real feed
  const mergedFeed = useMemo(() => {
    if (!timelineFeed) {
      return null;
    }
    const filteredOptimistic = filterOptimisticEvents(optimisticEvents, timelineFeed.events);
    return {
      ...timelineFeed,
      events: [...filteredOptimistic, ...timelineFeed.events],
      metadata: {
        ...timelineFeed.metadata,
        totalEvents: filteredOptimistic.length + timelineFeed.events.length,
      },
    };
  }, [timelineFeed, optimisticEvents]);

  // Load timeline feed
  const loadTimelineFeed = useCallback(
    async (sort: string = defaultSort, page: number = 1) => {
      if (!user?.id) {
        return;
      }

      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setIsLoadingMore(true);
        }
        setError(null);

        let feed: TimelineFeedResponse;

        if (mode === 'timeline') {
          feed = await timelineService.getEnrichedUserFeed(user.id, {}, { page, limit: 20 });
        } else {
          feed = await timelineService.getCommunityFeed(
            { sortBy: sort as 'recent' | 'trending' | 'popular' },
            { page, limit: 20 }
          );
        }

        if (page === 1) {
          setTimelineFeed(feed);
        } else {
          setTimelineFeed(prev => {
            if (!prev) {
              return feed;
            }
            return {
              ...feed,
              events: [...prev.events, ...feed.events],
            };
          });
        }
      } catch (err) {
        logger.error(
          `Failed to load ${mode} timeline`,
          err,
          mode === 'timeline' ? 'Journey' : 'Community'
        );
        setError(`Failed to load ${mode === 'timeline' ? 'your journey' : 'community posts'}`);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [user?.id, mode, defaultSort]
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (newSort: 'recent' | 'trending' | 'popular') => {
      setSortBy(newSort);
      loadTimelineFeed(newSort);
    },
    [loadTimelineFeed]
  );

  // Handle timeline event updates
  const handleEventUpdate = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (eventId: string, updates: any) => {
      if (!timelineFeed) {
        return;
      }

      setTimelineFeed(prev => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          events: prev.events.map(event =>
            event.id === eventId ? { ...event, ...updates } : event
          ),
        };
      });
    },
    [timelineFeed]
  );

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (searchResults !== null) {
      return;
    }
    if (!timelineFeed?.pagination.hasNext) {
      return;
    }
    loadTimelineFeed(sortBy, timelineFeed.pagination.page + 1);
  }, [timelineFeed, sortBy, loadTimelineFeed, searchResults]);

  // Handle search
  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const query = searchQuery.trim();
      if (query.length < 2) {
        setSearchError('Enter at least 2 characters');
        setSearchResults(null);
        setSearchTotal(null);
        return;
      }

      setSearching(true);
      setSearchError(null);

      const result = await timelineService.searchPosts(query, { limit: 30, offset: 0 });

      if (!result.success) {
        setSearchError(result.error || 'Search failed. Please try again.');
        setSearchResults(null);
        setSearchTotal(null);
      } else {
        setSearchResults(result.posts || []);
        setSearchTotal(result.total ?? result.posts?.length ?? 0);
      }

      setSearching(false);
    },
    [searchQuery]
  );

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchTotal(null);
    setSearchError(null);
  }, []);

  // Load data on mount
  useEffect(() => {
    if (hydrated && user?.id) {
      loadTimelineFeed();
    }
  }, [hydrated, user?.id, loadTimelineFeed]);

  return {
    // Auth state
    user,
    isLoading,
    hydrated,
    authCheckComplete,

    // Timeline state
    timelineFeed,
    mergedFeed,
    loading,
    isLoadingMore,
    error,
    sortBy,

    // Search state
    searchQuery,
    searchResults,
    searchTotal,
    searchError,
    searching,
    isSearchActive,

    // Actions
    setSearchQuery,
    loadTimelineFeed,
    handleSortChange,
    handleEventUpdate,
    handleLoadMore,
    handleSearch,
    handleClearSearch,
    handleOptimisticUpdate,
    invalidateTimelineCache,
  };
}
