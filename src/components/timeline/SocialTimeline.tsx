/**
 * SocialTimeline Component
 *
 * Displays personal or community timeline with posts, search, and sorting.
 * Logic extracted to useSocialTimeline hook, controls to separate components.
 */

'use client';

import React, { useRef } from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import TimelineLayout from './TimelineLayout';
import { TimelineFeedResponse } from '@/types/timeline';
import TimelineComposer from './TimelineComposer';
import { TimelineSkeleton } from './TimelineSkeleton';
import { useSocialTimeline } from './useSocialTimeline';
import { TimelineSortingControls } from './TimelineSortingControls';
import { TimelineSearchControls } from './TimelineSearchControls';

export interface SocialTimelineProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  mode: 'timeline' | 'community';
  timelineOwnerId?: string;
  timelineOwnerType?: 'profile' | 'project';
  timelineOwnerName?: string;
  showShareButton?: boolean;
  shareButtonText?: string;
  shareButtonIcon?: LucideIcon;
  defaultSort?: 'recent' | 'trending' | 'popular';
  showSortingControls?: boolean;
  customStats?: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalFollowers?: number;
  };
  showInlineComposer?: boolean;
  allowProjectSelection?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOptimisticUpdate?: (event: any) => void;
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
  const composerRef = useRef<HTMLDivElement | null>(null);

  const {
    user,
    hydrated,
    authCheckComplete,
    isLoading,
    mergedFeed,
    timelineFeed,
    loading,
    isLoadingMore,
    error,
    sortBy,
    searchQuery,
    searchResults,
    searchTotal,
    searchError,
    searching,
    isSearchActive,
    setSearchQuery,
    loadTimelineFeed,
    handleSortChange,
    handleEventUpdate,
    handleLoadMore,
    handleSearch,
    handleClearSearch,
    handleOptimisticUpdate,
    invalidateTimelineCache,
  } = useSocialTimeline({ mode, defaultSort, onOptimisticUpdate });

  // Early return for unauthenticated users
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

  // Show loading skeleton while auth check is in progress
  if (!authCheckComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 p-4">
        <TimelineSkeleton count={5} />
      </div>
    );
  }

  const isInitialLoad = !hydrated || isLoading;

  // Search controls component
  const searchControls = (
    <TimelineSearchControls
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onSearch={handleSearch}
      onClearSearch={handleClearSearch}
      isSearchActive={isSearchActive}
      searching={searching}
      searchError={searchError}
      searchResultsCount={searchResults?.length || 0}
      searchTotal={searchTotal}
    />
  );

  // Inline composer
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
          onPostCreated={() => {
            loadTimelineFeed(sortBy);
            invalidateTimelineCache();
          }}
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

  // Build timeline feed content
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
        filters: { ...timelineFeedContent.filters, search: searchQuery },
        metadata: {
          ...timelineFeedContent.metadata,
          totalEvents: searchResults?.length || 0,
          lastUpdated: new Date().toISOString(),
        },
      }
    : timelineFeedContent;

  // Empty state rendering
  const emptyState = isSearchActive ? (
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
      <Icon className="w-16 h-16 text-red-300 mx-auto mb-4" />
      <p className="text-red-600 text-lg mb-4">{error}</p>
      <Button variant="outline" onClick={() => loadTimelineFeed(sortBy)}>
        Try Again
      </Button>
    </div>
  ) : timelineFeed?.events.length === 0 ? (
    <div className="text-center py-16">
      <Icon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
      <p className="text-gray-600 max-w-md mx-auto">
        {mode === 'timeline'
          ? "Share your first update about what you're working on!"
          : 'Be the first to share something productive with the community!'}
      </p>
    </div>
  ) : null;

  // Header content with sorting and share button
  const headerContent =
    showSortingControls || (showShareButton && user) ? (
      <>
        {showSortingControls && (
          <TimelineSortingControls sortBy={sortBy} onSortChange={handleSortChange} />
        )}
        {showShareButton && user && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (composerRef.current) {
                const element = composerRef.current;
                const elementPosition = element.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({ top: elementPosition - 80, behavior: 'smooth' });
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
      isLoadingMore={isLoadingMore}
      stats={timelineStats}
      showFilters={false}
      compact={false}
      enableMultiSelect={mode === 'timeline'}
      additionalHeaderContent={headerContent}
      emptyState={emptyState}
      inlineComposer={inlineComposer}
      postComposer={postComposer}
    />
  );
}
