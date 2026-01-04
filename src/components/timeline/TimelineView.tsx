'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { timelineService } from '@/services/timeline';
import { TimelineFeedResponse, TimelineDisplayEvent } from '@/types/timeline';
import TimelineComponent from './TimelineComponent';
import TimelineComposer from './TimelineComposer';
import Button from '@/components/ui/Button';
import { logger } from '@/utils/logger';
import { filterOptimisticEvents } from '@/utils/timeline';

/**
 * TimelineView Component - Reusable Timeline Display
 *
 * DRY, modular component that fetches and displays timelines.
 * Used across all timeline contexts: journey, community, profiles, projects.
 *
 * Data Fetching Strategy:
 * - 'journey': Shows user's own posts (actor_id = userId) - posts the user created
 * - 'community': Shows all public posts
 * - 'profile': Shows posts on a specific profile (subject_id = profileId) - posts on that profile's timeline
 * - 'project': Shows posts on a specific project (subject_id = projectId) - posts on that project's timeline
 *
 * IMPORTANT: 'journey' and 'profile' show DIFFERENT data:
 * - Journey (My Timeline): Shows posts WHERE user is the actor (posts user created)
 * - Profile Timeline: Shows posts WHERE profile is the subject (posts on that profile's timeline)
 * 
 * This means a post can appear on a profile timeline but not in "My Timeline" if:
 * - Someone else posted on that profile's timeline, OR
 * - The user posted on someone else's profile timeline
 */

export interface TimelineViewProps {
  // Feed configuration
  feedType: 'journey' | 'community' | 'profile' | 'project';
  ownerId?: string; // Profile ID or Project ID (required for profile/project feeds)
  ownerType?: 'profile' | 'project'; // Type of owner

  // Display options
  showComposer?: boolean;
  compact?: boolean;
  showFilters?: boolean;

  // Empty state customization
  emptyStateTitle?: string;
  emptyStateDescription?: string;

  // Callbacks
  onPostCreated?: () => void;
  onOptimisticEvent?: (event: any) => void; // Add optimistic event to UI immediately
}

/**
 * TimelineView - Universal Timeline Component
 *
 * Handles data fetching, loading states, and rendering for all timeline types.
 */
export default function TimelineView({
  feedType,
  ownerId,
  ownerType = 'profile',
  showComposer = false,
  compact = false,
  showFilters = false,
  emptyStateTitle,
  emptyStateDescription,
  onPostCreated,
  onOptimisticEvent,
}: TimelineViewProps) {
  const { user, isLoading: authLoading, hydrated } = useAuth();
  const [feed, setFeed] = useState<TimelineFeedResponse | null>(null);
  const [optimisticEvents, setOptimisticEvents] = useState<TimelineDisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle optimistic event updates
  const handleOptimisticEvent = useCallback((event: TimelineDisplayEvent) => {
    // Add optimistic event to the beginning of the list
    setOptimisticEvents(prev => [event, ...prev]);
    onOptimisticEvent?.(event);
  }, [onOptimisticEvent]);

  // Remove optimistic event when real event arrives
  const removeOptimisticEvent = useCallback((optimisticId: string) => {
    setOptimisticEvents(prev => prev.filter(event => event.id !== optimisticId));
  }, []);

  // Merge optimistic events with real feed using shared utility (DRY)
  const mergedEvents = React.useMemo(() => {
    if (!feed?.events) {return optimisticEvents;}

    // Use centralized utility to filter optimistic events
    const filteredOptimistic = filterOptimisticEvents(optimisticEvents, feed.events);

    return [...filteredOptimistic, ...feed.events];
  }, [feed?.events, optimisticEvents]);

  // Create merged feed for rendering (must be declared before any early returns)
  const mergedFeed = React.useMemo(() => {
    if (!feed) {return null;}
    return {
      ...feed,
      events: mergedEvents,
      metadata: {
        ...feed.metadata,
        totalEvents: mergedEvents.length,
      },
    } as TimelineFeedResponse;
  }, [feed, mergedEvents]);

  // Validate required props
  useEffect(() => {
    if ((feedType === 'profile' || feedType === 'project') && !ownerId) {
      logger.error(
        `TimelineView: ownerId is required for ${feedType} feed type`,
        null,
        'TimelineView'
      );
      setError(`Invalid configuration: missing ${feedType} ID`);
    }
  }, [feedType, ownerId]);

  // Load timeline feed
  const loadFeed = useCallback(
    async (page: number = 1) => {
      // Don't load if we don't have required data yet
      if (!hydrated) {
        return;
      }
      if ((feedType === 'profile' || feedType === 'project') && !ownerId) {
        return;
      }
      if ((feedType === 'journey' || feedType === 'community') && !user?.id) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let feedData: TimelineFeedResponse;

        switch (feedType) {
          case 'journey':
            // User's own posts (actor_id = userId)
            feedData = await timelineService.getEnrichedUserFeed(user!.id, {}, { page, limit: 20 });
            break;

          case 'community':
            // All public posts
            feedData = await timelineService.getCommunityFeed({}, { page, limit: 20 });
            break;

          case 'profile':
            // Posts on a specific profile's timeline (subject_id = profileId)
            feedData = await timelineService.getProfileFeed(ownerId!, {}, { page, limit: 20 });
            break;

          case 'project':
            // Posts on a specific project's timeline (subject_id = projectId)
            feedData = await timelineService.getProjectFeed(ownerId!, {}, { page, limit: 20 });
            break;

          default:
            throw new Error(`Unknown feed type: ${feedType}`);
        }

        setFeed(feedData);
      } catch (err) {
        logger.error(`Failed to load ${feedType} timeline`, err, 'TimelineView');
        setError(`Failed to load timeline`);
      } finally {
        setLoading(false);
      }
    },
    [feedType, ownerId, user?.id, hydrated]
  );

  // Load feed on mount and when dependencies change
  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Handle event updates (likes, comments, etc.)
  const handleEventUpdate = useCallback(
    (eventId: string, updates: Partial<TimelineDisplayEvent>) => {
      setFeed(prev => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          events: prev.events
            .map(event => (event.id === eventId ? { ...event, ...updates } : event))
            .filter(event => !event.isDeleted), // Remove deleted events
        };
      });
    },
    []
  );

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!feed?.pagination.hasNext) {
      return;
    }
    loadFeed(feed.pagination.page + 1);
  }, [feed, loadFeed]);

  // Handle post creation refresh
  const handlePostCreated = useCallback(() => {
    loadFeed(1); // Reload first page
    onPostCreated?.();
  }, [loadFeed, onPostCreated]);

  // Auth check for journey/community
  if (hydrated && !authLoading && !user && (feedType === 'journey' || feedType === 'community')) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
        <p className="text-gray-600 mb-6">You need to be signed in to view this timeline.</p>
        <Button onClick={() => (window.location.href = '/auth')}>Sign In</Button>
      </div>
    );
  }

  // Loading state
  if (!hydrated || authLoading || loading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <Button variant="outline" onClick={() => loadFeed()}>
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (feed && feed.events.length === 0) {
    const defaultTitle =
      feedType === 'journey'
        ? 'No posts yet'
        : feedType === 'community'
          ? 'No community posts yet'
          : 'No posts on this timeline yet';

    const defaultDescription =
      feedType === 'journey'
        ? "Share your first update about what you're working on!"
        : feedType === 'community'
          ? 'Be the first to share something with the community!'
          : 'Be the first to post on this timeline!';

    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {emptyStateTitle || defaultTitle}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {emptyStateDescription || defaultDescription}
        </p>
      </div>
    );
  }

  // Render timeline
  return (
    <div className="space-y-4">
      {/* Focus handling: if ?focus=<eventId> present, scroll that post into view */}
      {mergedFeed && (
        <FocusScroller />
      )}
      {/* Timeline Composer - Show at top if enabled */}
      {showComposer && (
        user ? (
          <TimelineComposer
            targetOwnerId={ownerId}
            targetOwnerType={ownerType}
            allowProjectSelection={feedType === 'profile' || feedType === 'project'}
            onPostCreated={handlePostCreated}
            placeholder={
              feedType === 'profile'
                ? 'Write on this timeline...'
                : feedType === 'project'
                  ? 'Share an update about this project...'
                  : "What's on your mind?"
            }
            buttonText="Post"
            showBanner={Boolean(ownerId && ownerId !== user.id)}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white/80 px-4 py-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">Sign in to post</p>
                <p className="text-sm text-gray-600">You need to be signed in to write on this timeline.</p>
              </div>
              <Button
                onClick={() => {
                  const redirect = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/profiles/me';
                  window.location.href = `/auth?redirect=${encodeURIComponent(redirect)}`;
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Sign in
              </Button>
            </div>
          </div>
        )
      )}

      {/* Timeline Feed */}
      {mergedFeed && (
        <TimelineComponent
          feed={mergedFeed}
          onEventUpdate={handleEventUpdate}
          onLoadMore={handleLoadMore}
          showFilters={showFilters}
          compact={compact}
        />
      )}
    </div>
  );
}

// Helper component to handle focus scrolling post-render
function FocusScroller() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const focusId = params.get('focus');
      if (focusId) {
        const el = document.querySelector(`[data-event-id="${focusId}"]`);
        if (el) {
          (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          (el as HTMLElement).classList.add('ring-2', 'ring-orange-400', 'ring-offset-2');
          setTimeout(() => {
            (el as HTMLElement).classList.remove('ring-2', 'ring-orange-400', 'ring-offset-2');
          }, 1800);
        }
      }
    } catch {}
  }, []);
  return null;
}
