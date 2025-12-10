import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { timelineService } from '@/services/timeline';
import TimelineLayout from './TimelineLayout';
import { TimelineDisplayEvent, TimelineFeedResponse } from '@/types/timeline';
import Button from '@/components/ui/Button';
import { LucideIcon, TrendingUp, Clock, Flame, Plus, Search, Loader2, X } from 'lucide-react';
import { logger } from '@/utils/logger';
import TimelineComposer from './TimelineComposer';
import { TimelineSkeleton } from './TimelineSkeleton';

export interface SocialTimelineProps {
  // Page identity
  title: string;
  description: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;

  // Data source
  mode: 'timeline' | 'community';

  // Timeline ownership (for cross-posting)
  timelineOwnerId?: string; // Whose timeline posts appear on
  timelineOwnerType?: 'profile' | 'project'; // Type of timeline owner
  timelineOwnerName?: string; // Display name for context

  // Header customization
  showShareButton?: boolean;
  shareButtonText?: string;
  shareButtonIcon?: LucideIcon;

  // Timeline configuration
  defaultSort?: 'recent' | 'trending' | 'popular';
  showSortingControls?: boolean;

  // Stats configuration
  customStats?: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalFollowers?: number;
  };

  // Inline composer
  showInlineComposer?: boolean;
  allowProjectSelection?: boolean;
  onOptimisticUpdate?: (event: any) => void; // For immediate UI feedback on posts
}

export default function SocialTimeline({
  title,
  description,
  icon: Icon,
  gradientFrom,
  gradientVia,
  gradientTo,
  mode,
  timelineOwnerId,
  timelineOwnerType = 'profile',
  timelineOwnerName,
  showShareButton = false,
  shareButtonText = 'Share Update',
  shareButtonIcon: ShareIcon = Plus,
  defaultSort = 'trending',
  showSortingControls = false,
  customStats,
  showInlineComposer = false,
  allowProjectSelection = false,
  onOptimisticUpdate,
}: SocialTimelineProps) {
  const { user, isLoading, hydrated } = useAuth();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [timelineFeed, setTimelineFeed] = useState<TimelineFeedResponse | null>(null);
  const [optimisticEvents, setOptimisticEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TimelineDisplayEvent[] | null>(null);
  const [searchTotal, setSearchTotal] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  // Handle optimistic event updates
  const handleOptimisticUpdate = useCallback(
    (event: any) => {
      setOptimisticEvents(prev => [event, ...prev]);
      onOptimisticUpdate?.(event);
    },
    [onOptimisticUpdate]
  );

  // Merge optimistic events with real feed
  const mergedFeed = React.useMemo(() => {
    if (!timelineFeed) {
      return null;
    }

    // Remove optimistic events that have been replaced by real events
    const filteredOptimistic = optimisticEvents.filter(
      optEvent =>
        !timelineFeed.events.some((realEvent: any) => {
          // Match by content and timestamp (simple heuristic)
          return (
            realEvent.description === optEvent.description &&
            Math.abs(
              new Date(realEvent.eventTimestamp).getTime() -
                new Date(optEvent.eventTimestamp).getTime()
            ) < 5000
          ); // 5 second window
        })
    );

    return {
      ...timelineFeed,
      events: [...filteredOptimistic, ...timelineFeed.events],
      metadata: {
        ...timelineFeed.metadata,
        totalEvents: filteredOptimistic.length + timelineFeed.events.length,
      },
    };
  }, [timelineFeed, optimisticEvents]);
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'popular'>(defaultSort);
  const composerRef = useRef<HTMLDivElement | null>(null);

  // Give auth state time to fully restore from localStorage
  useEffect(() => {
    if (hydrated) {
      const timer = setTimeout(() => {
        setAuthCheckComplete(true);
      }, 1500); // Wait 1.5 seconds for auth state to restore
      return () => clearTimeout(timer);
    }
  }, [hydrated]);

  // Load timeline feed based on mode
  const loadTimelineFeed = useCallback(
    async (sort: string = defaultSort, page: number = 1) => {
      if (!user?.id) {
        return;
      }

      try {
        // Only show loading on initial load (page 1)
        if (page === 1) {
          setLoading(true);
        }
        setError(null);

        let feed: TimelineFeedResponse;

        if (mode === 'timeline') {
          // Personal timeline - user's own posts
          feed = await timelineService.getEnrichedUserFeed(user.id, {}, { page, limit: 20 });
        } else {
          // Community timeline - public posts from all users
          feed = await timelineService.getCommunityFeed(
            { sortBy: sort as 'recent' | 'trending' | 'popular' },
            { page, limit: 20 }
          );
        }

        // Append events for pagination, replace for initial load or sort change
        if (page === 1) {
          setTimelineFeed(feed);
        } else {
          setTimelineFeed(prev => {
            if (!prev) return feed;
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
      // Disable pagination while search results are active
      return;
    }

    if (!timelineFeed?.pagination.hasNext) {
      return;
    }
    loadTimelineFeed(sortBy, timelineFeed.pagination.page + 1);
  }, [timelineFeed, sortBy, loadTimelineFeed, searchResults]);

  const isSearchActive = searchResults !== null;

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

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchTotal(null);
    setSearchError(null);
  }, []);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (hydrated && user?.id) {
      loadTimelineFeed();
    }
  }, [hydrated, user?.id, loadTimelineFeed]);

  // Early return for unauthenticated users (show immediately, no double loading)
  // Be more lenient - only show sign-in if we're sure the user is not authenticated
  // Wait for auth check to complete before showing sign-in message
  if (hydrated && authCheckComplete && !isLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to view this page.</p>
          <Button onClick={() => (window.location.href = '/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  // Show loading while auth check is in progress
  if (hydrated && !authCheckComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
          <p className="text-gray-600 mb-6">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // Show layout immediately with loading state in feed (no double loading screen)
  const isInitialLoad = !hydrated || isLoading;

  // Sorting controls component
  const SortingControls = () => (
    <div className="flex bg-white/50 rounded-xl p-1">
      <Button
        variant={sortBy === 'trending' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => handleSortChange('trending')}
        className={`px-3 py-2 text-sm ${sortBy === 'trending' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
      >
        <TrendingUp className="w-4 h-4 mr-1" />
        Trending
      </Button>
      <Button
        variant={sortBy === 'recent' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => handleSortChange('recent')}
        className={`px-3 py-2 text-sm ${sortBy === 'recent' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
      >
        <Clock className="w-4 h-4 mr-1" />
        Recent
      </Button>
      <Button
        variant={sortBy === 'popular' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => handleSortChange('popular')}
        className={`px-3 py-2 text-sm ${sortBy === 'popular' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
      >
        <Flame className="w-4 h-4 mr-1" />
        Popular
      </Button>
    </div>
  );

  const searchControls = (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search posts (title or description)..."
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <Button type="submit" size="sm" disabled={searching} className="gap-2">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {searching ? 'Searching' : 'Search'}
        </Button>
        {isSearchActive && (
          <Button type="button" size="sm" variant="ghost" onClick={handleClearSearch} className="text-gray-600">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </form>
      {searchError && <p className="text-sm text-red-600 mt-2">{searchError}</p>}
      {isSearchActive && !searchError && (
        <p className="text-xs text-gray-500 mt-2">
          Showing {searchResults?.length || 0} of {searchTotal ?? searchResults?.length ?? 0} results
        </p>
      )}
    </div>
  );

  const inlineComposer =
    showInlineComposer && user ? (
      <div ref={composerRef}>
        {searchControls}
        <TimelineComposer
          targetOwnerId={timelineOwnerId || (mode === 'timeline' ? user.id : undefined)}
          targetOwnerType={timelineOwnerType}
          targetOwnerName={timelineOwnerName}
          allowProjectSelection={allowProjectSelection}
          placeholder={
            mode === 'timeline' ? "What's on your mind?" : 'Share something with the community...'
          }
          buttonText={mode === 'timeline' ? 'Share Update' : 'Post'}
          onPostCreated={() => loadTimelineFeed(sortBy)}
          onOptimisticUpdate={handleOptimisticUpdate}
          showBanner={Boolean(timelineOwnerId && timelineOwnerId !== user.id)}
        />
      </div>
    ) : undefined;

  const postComposer = inlineComposer === undefined ? searchControls : undefined;

  // Calculate stats
  const timelineStats =
    customStats ||
    (timelineFeed
      ? {
          totalPosts: timelineFeed.events.length,
          totalLikes: timelineFeed.events.reduce((sum, e) => sum + (e.likesCount || 0), 0),
          totalComments: timelineFeed.events.reduce((sum, e) => sum + (e.commentsCount || 0), 0),
          totalFollowers:
            mode === 'timeline' ? timelineFeed.events.filter(e => e.isRecent).length : undefined,
        }
      : undefined);

  // Timeline feed content
  const timelineFeedContent = mergedFeed || {
    events: [],
    pagination: { page: 1, limit: 20, total: 0, hasNext: false, hasPrev: false },
    filters: {
      eventTypes: [],
      dateRange: 'all',
      visibility: ['public'],
      actors: [],
      subjects: [],
      tags: [],
      sortBy,
    },
    metadata: { totalEvents: 0, featuredEvents: 0, lastUpdated: new Date().toISOString() },
  };

  // Override feed when search is active
  const activeFeed: TimelineFeedResponse = isSearchActive
    ? {
        events: searchResults || [],
        pagination: {
          page: 1,
          limit: searchResults?.length || 0,
          total: searchResults?.length || 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: {
          ...timelineFeedContent.filters,
          search: searchQuery,
        },
        metadata: {
          ...timelineFeedContent.metadata,
          totalEvents: searchResults?.length || 0,
          lastUpdated: new Date().toISOString(),
        },
      }
    : timelineFeedContent;

  // Single, clean empty state (no double loading)
  const emptyState =
    isSearchActive ? (
      searching ? (
        <TimelineSkeleton count={3} />
      ) : searchError ? (
        <div className="text-center py-10">
          <Icon className="w-14 h-14 text-red-300 mx-auto mb-3" />
          <p className="text-red-600 text-lg mb-2">{searchError}</p>
          <Button variant="outline" onClick={handleClearSearch}>
            Clear Search
          </Button>
        </div>
      ) : activeFeed.events.length === 0 ? (
        <div className="text-center py-10">
          <Icon className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No posts found</h3>
          <p className="text-gray-600">Try another search term.</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={handleClearSearch}>
              Clear search
            </Button>
          </div>
        </div>
      ) : null
    ) : isInitialLoad || loading ? (
      <TimelineSkeleton count={5} />
    ) : error ? (
      <div className="text-center py-16">
        <div className="mb-4">
          <Icon className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Button variant="outline" onClick={() => loadTimelineFeed(sortBy)}>
            Try Again
          </Button>
        </div>
      </div>
    ) : timelineFeed?.events.length === 0 ? (
      <div className="text-center py-16">
        <Icon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {mode === 'timeline' ? 'No posts yet' : 'No posts yet'}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {mode === 'timeline'
            ? "Share your first update about what you're working on!"
            : 'Be the first to share something productive with the community!'}
        </p>
      </div>
    ) : null;

  const headerContent =
    showSortingControls || (showShareButton && user) ? (
      <>
        {showSortingControls && <SortingControls />}
        {showShareButton && user && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              // Scroll to composer smoothly without causing jumps
              if (composerRef.current) {
                const element = composerRef.current;
                const elementPosition = element.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - 80; // Account for sticky header
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            }}
            className="inline-flex items-center gap-2"
          >
            <ShareIcon className="w-4 h-4" />
            {shareButtonText}
          </Button>
        )}
      </>
    ) : undefined;

  return (
    <TimelineLayout
      title={title}
      description={description}
      icon={Icon}
      gradientFrom={gradientFrom}
      gradientVia={gradientVia}
      gradientTo={gradientTo}
      feed={activeFeed}
      onEventUpdate={handleEventUpdate}
      onLoadMore={handleLoadMore}
      stats={timelineStats}
      showFilters={false}
      compact={false}
      enableMultiSelect={mode === 'timeline'} // Enable multi-select for personal timeline (management mode)
      additionalHeaderContent={headerContent}
      emptyState={emptyState}
      inlineComposer={inlineComposer}
      postComposer={postComposer}
    />
  );
}
