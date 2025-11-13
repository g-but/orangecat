import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { timelineService } from '@/services/timeline';
import TimelineLayout from './TimelineLayout';
import { TimelineFeedResponse } from '@/types/timeline';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import { LucideIcon, TrendingUp, Clock, Flame, Plus } from 'lucide-react';
import { logger } from '@/utils/logger';
import { Card, CardContent } from '@/components/ui/Card';

/**
 * TwitterTimeline Component - Unified Twitter-like Timeline
 *
 * DRY, modular, and maintainable component that powers both:
 * - My Journey (personal timeline)
 * - Community (public timeline)
 *
 * Only difference is data source and some configuration options.
 */

export interface TwitterTimelineProps {
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
}

/**
 * Unified Twitter-like Timeline Component
 *
 * Provides identical interface for both personal and community timelines.
 * Only difference is data source and minor configuration options.
 */
export default function TwitterTimeline({
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
}: TwitterTimelineProps) {
  const { user, isLoading, hydrated } = useAuth();
  const [timelineFeed, setTimelineFeed] = useState<TimelineFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'popular'>(defaultSort);

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
  if (hydrated && !isLoading && !user) {
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

  // Inline Post Composer - Twitter style, adapted for productive activities
  const InlinePostComposer = () => {
    const [content, setContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [postSuccess, setPostSuccess] = useState(false);

    // Determine whose timeline we're posting on
    const postingOnOwnTimeline = !timelineOwnerId || timelineOwnerId === user?.id;
    const targetName =
      timelineOwnerName || (postingOnOwnTimeline ? 'your timeline' : 'this timeline');

    // Simple, frictionless prompts
    const helpfulPrompts = postingOnOwnTimeline
      ? [
          "What's on your mind?",
          'Share an update...',
          'What are you working on?',
          'Share your progress...',
        ]
      : [
          `Write on ${targetName}...`,
          `Share your thoughts on ${targetName}...`,
          `What would you like to say?`,
        ];
    const [currentPrompt] = useState(
      helpfulPrompts[Math.floor(Math.random() * helpfulPrompts.length)]
    );

    const handlePost = async () => {
      if (!content.trim() || isPosting || !user?.id) {
        return;
      }

      setIsPosting(true);
      setError(null);
      setPostSuccess(false);

      try {
        // Cross-timeline posting: actor is YOU, subject is WHOSE timeline it appears on
        const result = await timelineService.createEvent({
          eventType: 'status_update',
          actorId: user.id, // WHO is writing (always the authenticated user)
          subjectType: timelineOwnerType, // WHOSE timeline it appears on
          subjectId: timelineOwnerId || user.id, // Default to own timeline if not specified
          title: postingOnOwnTimeline ? 'Shared an update' : `Posted on ${targetName}`,
          description: content.trim(),
          visibility: 'public',
          metadata: {
            content: content.trim(),
            is_user_post: true,
            cross_posted: !postingOnOwnTimeline,
            timeline_owner: timelineOwnerName,
          },
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create post');
        }

        setContent('');
        setPostSuccess(true);
        setTimeout(() => setPostSuccess(false), 3000);

        // Refresh timeline
        await loadTimelineFeed(sortBy);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
        logger.error('Failed to create post', error, 'InlinePostComposer');
        setError(errorMessage);
      } finally {
        setIsPosting(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handlePost();
      }
    };

    return (
      <Card className="mb-4 border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/30 via-white to-yellow-50/20 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Timeline Context Banner */}
          {!postingOnOwnTimeline && (
            <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm">
              <span className="text-blue-700 font-medium">✍️ Posting on {targetName}</span>
              <span className="text-blue-500 text-xs">
                (Your post will appear on their timeline)
              </span>
            </div>
          )}

          <div className="flex gap-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.name || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <span className="text-white font-semibold text-base">
                    {(user.user_metadata?.name || user.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Post Input */}
            <div className="flex-1 min-w-0">
              <textarea
                value={content}
                onChange={e => {
                  setContent(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={currentPrompt}
                className="w-full border-0 resize-none text-lg placeholder-gray-500 focus:outline-none bg-transparent"
                rows={3}
                maxLength={500}
                disabled={isPosting}
              />

              {/* Error/Success Messages */}
              {error && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              {postSuccess && (
                <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  ✓ Post shared successfully!
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-4 flex-wrap">
                  <div
                    className={`text-sm font-medium ${content.length > 450 ? 'text-red-500' : content.length > 400 ? 'text-orange-500' : 'text-gray-500'}`}
                  >
                    {content.length}/500
                  </div>
                  <div className="text-xs text-gray-400 hidden sm:block">
                    Press Ctrl+Enter to post
                  </div>
                </div>
                <Button
                  onClick={handlePost}
                  disabled={!content.trim() || isPosting || content.length > 500}
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-300 text-white px-6 py-2 rounded-full font-semibold transition-all shadow-sm hover:shadow-md disabled:shadow-none"
                  size="sm"
                >
                  {isPosting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Posting...
                    </span>
                  ) : (
                    'Share'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calculate stats
  const timelineStats =
    customStats ||
    (timelineFeed
      ? {
          totalPosts: timelineFeed.events.length,
          totalLikes: timelineFeed.events.reduce((sum, e) => sum + (e.likesCount || 0), 0),
          totalComments: timelineFeed.events.reduce((sum, e) => sum + (e.commentsCount || 0), 0),
          totalFollowers:
            mode === 'journey' ? timelineFeed.events.filter(e => e.isRecent).length : undefined,
        }
      : undefined);

  // Timeline feed content
  const timelineFeedContent = timelineFeed || {
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

  // Header content (sorting controls for community)
  const headerContent = showSortingControls ? <SortingControls /> : undefined;

  // Inline composer
  const inlineComposer = showInlineComposer ? <InlinePostComposer /> : undefined;

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
