'use client';

/**
 * Timeline Query Hook
 *
 * Custom React Query hook for fetching and caching timeline data.
 * Provides stale-while-revalidate behavior for instant page loads
 * when navigating back to timeline pages.
 *
 * @module hooks/useTimelineQuery
 */

import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { timelineService } from '@/services/timeline';
import { TimelineFeedResponse, TimelineDisplayEvent } from '@/types/timeline';

// Query key factory for consistent cache keys
export const timelineKeys = {
  all: ['timeline'] as const,
  userFeed: (userId: string) => [...timelineKeys.all, 'user', userId] as const,
  communityFeed: (sortBy: string) => [...timelineKeys.all, 'community', sortBy] as const,
  search: (query: string) => [...timelineKeys.all, 'search', query] as const,
  post: (postId: string) => [...timelineKeys.all, 'post', postId] as const,
};

interface UseTimelineFeedOptions {
  userId: string;
  enabled?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Hook for fetching user's personal timeline with caching
 */
export function useUserTimelineFeed({
  userId,
  enabled = true,
  page = 1,
  limit = 20,
}: UseTimelineFeedOptions) {
  return useQuery({
    queryKey: [...timelineKeys.userFeed(userId), page],
    queryFn: async (): Promise<TimelineFeedResponse> => {
      return timelineService.getEnrichedUserFeed(userId, {}, { page, limit });
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000, // Data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

interface UseCommunityFeedOptions {
  sortBy: 'recent' | 'trending' | 'popular';
  enabled?: boolean;
}

/**
 * Hook for fetching community timeline with infinite scrolling
 */
export function useCommunityTimelineFeed({ sortBy, enabled = true }: UseCommunityFeedOptions) {
  return useInfiniteQuery({
    queryKey: timelineKeys.communityFeed(sortBy),
    queryFn: async ({ pageParam = 1 }): Promise<TimelineFeedResponse> => {
      return timelineService.getCommunityFeed({ sortBy }, { page: pageParam as number, limit: 20 });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for searching timeline posts with caching
 */
export function useTimelineSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: timelineKeys.search(query),
    queryFn: async () => {
      if (!query || query.length < 2) {
        return { success: true, posts: [], total: 0 };
      }
      return timelineService.searchPosts(query, { limit: 30, offset: 0 });
    },
    enabled: enabled && query.length >= 2,
    staleTime: 60 * 1000, // Search results fresh for 1 minute
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
  });
}

/**
 * Hook for invalidating timeline cache
 * Used after creating, updating, or deleting posts
 */
export function useInvalidateTimeline() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },
    invalidateUserFeed: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.userFeed(userId) });
    },
    invalidateCommunityFeed: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', 'community'] });
    },
    invalidateSearch: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', 'search'] });
    },
  };
}

/**
 * Hook for optimistically updating timeline cache
 * Used for instant UI updates when liking, commenting, etc.
 */
export function useOptimisticTimelineUpdate() {
  const queryClient = useQueryClient();

  return {
    // Optimistically add a new post to the feed
    addPost: (userId: string, newPost: TimelineDisplayEvent) => {
      queryClient.setQueryData(
        timelineKeys.userFeed(userId),
        (oldData: TimelineFeedResponse | undefined) => {
          if (!oldData) {
            return oldData;
          }
          return {
            ...oldData,
            events: [newPost, ...oldData.events],
            metadata: {
              ...oldData.metadata,
              totalEvents: oldData.metadata.totalEvents + 1,
            },
          };
        }
      );
    },

    // Optimistically update a post's likes count
    updateLikes: (postId: string, increment: number) => {
      // Update in all timeline caches that might contain this post
      queryClient.setQueriesData(
        { queryKey: timelineKeys.all },
        (oldData: TimelineFeedResponse | undefined) => {
          if (!oldData || !oldData.events) {
            return oldData;
          }
          return {
            ...oldData,
            events: oldData.events.map(event =>
              event.id === postId
                ? { ...event, likesCount: (event.likesCount || 0) + increment }
                : event
            ),
          };
        }
      );
    },

    // Optimistically remove a post from the feed
    removePost: (postId: string) => {
      queryClient.setQueriesData(
        { queryKey: timelineKeys.all },
        (oldData: TimelineFeedResponse | undefined) => {
          if (!oldData || !oldData.events) {
            return oldData;
          }
          return {
            ...oldData,
            events: oldData.events.filter(event => event.id !== postId),
            metadata: {
              ...oldData.metadata,
              totalEvents: Math.max(0, oldData.metadata.totalEvents - 1),
            },
          };
        }
      );
    },
  };
}

/**
 * Hook for prefetching timeline data
 * Used for instant navigation when hovering over links
 */
export function usePrefetchTimeline() {
  const queryClient = useQueryClient();

  return {
    prefetchUserFeed: (userId: string) => {
      queryClient.prefetchQuery({
        queryKey: [...timelineKeys.userFeed(userId), 1],
        queryFn: () => timelineService.getEnrichedUserFeed(userId, {}, { page: 1, limit: 20 }),
        staleTime: 30 * 1000,
      });
    },
    prefetchCommunityFeed: (sortBy: 'recent' | 'trending' | 'popular') => {
      queryClient.prefetchInfiniteQuery({
        queryKey: timelineKeys.communityFeed(sortBy),
        queryFn: () => timelineService.getCommunityFeed({ sortBy }, { page: 1, limit: 20 }),
        initialPageParam: 1,
        staleTime: 30 * 1000,
      });
    },
  };
}
