import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { timelineService } from '@/services/timeline';
import TimelineLayout from './TimelineLayout';
import { TimelineFeedResponse } from '@/types/timeline';
import Button from '@/components/ui/Button';
import { LucideIcon, TrendingUp, Clock, Flame, Plus } from 'lucide-react';
import { logger } from '@/utils/logger';
import TimelineComposer from './TimelineComposer';

export interface SocialTimelineProps {
  // Page identity
  title: string;
  description: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;

  // Data source
  mode: 'journey' | 'community';

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

  // Handle optimistic event updates
  const handleOptimisticUpdate = useCallback((event: any) => {
    setOptimisticEvents(prev => [event, ...prev]);
    onOptimisticUpdate?.(event);
  }, [onOptimisticUpdate]);

  // Merge optimistic events with real feed and deduplicate cross-posts
  const mergedFeed = React.useMemo(() => {
    if (!timelineFeed) return null;

    // Remove optimistic events that have been replaced by real events
    const filteredOptimistic = optimisticEvents.filter(optEvent =>
      !timelineFeed.events.some((realEvent: any) => {
        // Match by content and timestamp (simple heuristic)
        return realEvent.description === optEvent.description &&
               Math.abs(new Date(realEvent.eventTimestamp).getTime() - new Date(optEvent.eventTimestamp).getTime()) < 5000; // 5 second window
      })
    );

    let events = [...filteredOptimistic, ...timelineFeed.events];

    // Deduplicate cross-posts in community mode
    if (mode === 'community') {
      // Group events by original_post_id
      const eventGroups = new Map<string, any[]>();
      const standaloneEvents: any[] = [];

      events.forEach(event => {
        const originalPostId = event.metadata?.original_post_id;
        if (originalPostId) {
          // This is a cross-post
          if (!eventGroups.has(originalPostId)) {
            eventGroups.set(originalPostId, []);
          }
          eventGroups.get(originalPostId)!.push(event);
        } else if (event.metadata?.cross_posted_projects) {
          // This is the main post with cross-posts
          if (!eventGroups.has(event.id)) {
            eventGroups.set(event.id, []);
          }
          eventGroups.get(event.id)!.push(event);
        } else {
          // Regular standalone event
          standaloneEvents.push(event);
        }
      });

      // Process grouped events
      const deduplicatedEvents: any[] = [];
      eventGroups.forEach((group, mainPostId) => {
        // Find the main post (the one without cross_posted_from_main flag)
        const mainPost = group.find(e => !e.metadata?.cross_posted_from_main);

        if (mainPost) {
          // Collect all cross-posted project info
          const crossPosts = group.filter(e => e.metadata?.cross_posted_from_main);

          // Add cross-post information to the main post
          deduplicatedEvents.push({
            ...mainPost,
            metadata: {
              ...mainPost.metadata,
              cross_posts: crossPosts.map(cp => ({
                id: cp.id,
                project_id: cp.subjectId,
                project_name: cp.metadata?.project_name, // This would need to be added
              })),
            },
          });
        } else if (group.length > 0) {
          // If no main post found, just use the first one
          deduplicatedEvents.push(group[0]);
        }
      });

      events = [...standaloneEvents, ...deduplicatedEvents].sort((a, b) => {
        return new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime();
      });
    }

    return {
      ...timelineFeed,
      events,
      metadata: {
        ...timelineFeed.metadata,
        totalEvents: events.length,
      }
    };
  }, [timelineFeed, optimisticEvents, mode]);
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
        setLoading(true);
        setError(null);

        let feed: TimelineFeedResponse;

        if (mode === 'journey') {
          // Personal timeline - user's own posts
          feed = await timelineService.getEnrichedUserFeed(user.id, {}, { page, limit: 20 });
        } else {
          // Community timeline - public posts from all users
          feed = await timelineService.getCommunityFeed(
            { sortBy: sort as 'recent' | 'trending' | 'popular' },
            { page, limit: 20 }
          );
        }

        setTimelineFeed(feed);
      } catch (err) {
        logger.error(
          `Failed to load ${mode} timeline`,
          err,
          mode === 'journey' ? 'Journey' : 'Community'
        );
        setError(`Failed to load ${mode === 'journey' ? 'your journey' : 'community posts'}`);
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
    if (!timelineFeed?.pagination.hasNext) {
      return;
    }
    loadTimelineFeed(sortBy, timelineFeed.pagination.page + 1);
  }, [timelineFeed, sortBy, loadTimelineFeed]);

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

  const inlineComposer =
    showInlineComposer && user ? (
      <div ref={composerRef}>
        <TimelineComposer
          targetOwnerId={timelineOwnerId || (mode === 'journey' ? user.id : undefined)}
          targetOwnerType={timelineOwnerType}
          targetOwnerName={timelineOwnerName}
          allowProjectSelection={allowProjectSelection}
          placeholder={
            mode === 'journey'
              ? "What's on your mind?"
              : 'Share something with the community...'
          }
          buttonText={mode === 'journey' ? 'Share Update' : 'Post'}
          onPostCreated={() => loadTimelineFeed(sortBy)}
          onOptimisticUpdate={handleOptimisticUpdate}
          showBanner={Boolean(timelineOwnerId && timelineOwnerId !== user.id)}
        />
      </div>
    ) : undefined;

  // Fetch actual follower count for journey mode
  const [followerCount, setFollowerCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (mode === 'journey' && user?.id) {
      const fetchFollowerCount = async () => {
        try {
          const response = await fetch(`/api/social/followers/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setFollowerCount(data.data?.length || 0);
          }
        } catch (err) {
          logger.error('Failed to fetch follower count', err, 'SocialTimeline');
        }
      };
      fetchFollowerCount();
    }
  }, [mode, user?.id]);

  // Calculate stats
  const timelineStats =
    customStats ||
    (timelineFeed
      ? {
          totalPosts: timelineFeed.events.length,
          totalLikes: timelineFeed.events.reduce((sum, e) => sum + (e.likesCount || 0), 0),
          totalComments: timelineFeed.events.reduce((sum, e) => sum + (e.commentsCount || 0), 0),
          totalFollowers: mode === 'journey' ? followerCount : undefined,
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

  // Single, clean empty state (no double loading)
  const emptyState =
    isInitialLoad || loading ? (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-500 text-lg">
          Loading {mode === 'journey' ? 'your journey' : 'community'}...
        </p>
      </div>
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
          {mode === 'journey' ? 'No posts yet' : 'No posts yet'}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {mode === 'journey'
            ? "Share your first update about what you're working on!"
            : 'Be the first to share something productive with the community!'}
        </p>
      </div>
    ) : null;

  const headerContent =
    showSortingControls || (showShareButton && user)
      ? (
          <>
            {showSortingControls && <SortingControls />}
            {showShareButton && user && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="inline-flex items-center gap-2"
              >
                <ShareIcon className="w-4 h-4" />
                {shareButtonText}
              </Button>
            )}
          </>
        )
      : undefined;

  return (
    <TimelineLayout
      title={title}
      description={description}
      icon={Icon}
      gradientFrom={gradientFrom}
      gradientVia={gradientVia}
      gradientTo={gradientTo}
      feed={timelineFeedContent}
      onEventUpdate={handleEventUpdate}
      onLoadMore={handleLoadMore}
      stats={timelineStats}
      showFilters={false}
      compact={false}
      additionalHeaderContent={headerContent}
      emptyState={emptyState}
      inlineComposer={inlineComposer}
    />
  );
}
