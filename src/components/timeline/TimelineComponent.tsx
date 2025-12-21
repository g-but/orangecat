'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { TimelineDisplayEvent, TimelineFeedResponse, TimelineVisibility } from '@/types/timeline';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/useToast';
import { PostCard } from './PostCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Trash2, CheckSquare } from 'lucide-react';
import { usePostSelection } from '@/hooks/usePostSelection';
import { BulkActionsToolbar } from './BulkActionsToolbar';

interface TimelineComponentProps {
  feed: TimelineFeedResponse;
  onEventUpdate?: (eventId: string, updates: Partial<TimelineDisplayEvent>) => void;
  onLoadMore?: () => void;
  showFilters?: boolean;
  compact?: boolean;
  enableMultiSelect?: boolean;
}

export const TimelineComponent: React.FC<TimelineComponentProps> = ({
  feed,
  onEventUpdate,
  onLoadMore,
  showFilters = true,
  compact = false,
  enableMultiSelect = false,
}) => {
  const [events, setEvents] = useState(feed.events);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  // Sync events when feed changes (e.g., from optimistic updates)
  useEffect(() => {
    setEvents(feed.events);
  }, [feed.events]);

  // Use centralized selection hook (DRY)
  const {
    selectedIds,
    isSelectionMode,
    isProcessing,
    toggleSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    bulkDelete,
    bulkSetVisibility,
    selectedCount,
    canPerformBulkAction,
  } = usePostSelection({
    onPostsDeleted: (deletedIds) => {
      // Remove deleted events from local state
      setEvents(prev => prev.filter(e => !deletedIds.includes(e.id)));
      showSuccess(`Successfully deleted ${deletedIds.length} ${deletedIds.length === 1 ? 'post' : 'posts'}`);
    },
    onVisibilityChanged: (eventIds, newVisibility) => {
      // Update visibility in local state
      setEvents(prev =>
        prev.map(e =>
          eventIds.includes(e.id) ? { ...e, visibility: newVisibility } : e
        )
      );
      showSuccess(
        `Changed visibility of ${eventIds.length} ${eventIds.length === 1 ? 'post' : 'posts'} to ${newVisibility}`
      );
    },
  });

  // Handle individual event updates
  const handleEventUpdate = useCallback(
    (eventId: string, updates: Partial<TimelineDisplayEvent>) => {
      setEvents(prevEvents => {
        if (updates.isDeleted) {
          return prevEvents.filter(event => event.id !== eventId);
        }
        return prevEvents.map(event =>
          event.id === eventId ? { ...event, ...updates } : event
        );
      });
      onEventUpdate?.(eventId, updates);
    },
    [onEventUpdate]
  );

  // Handle individual post deletion
  const handlePostDelete = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    logger.info('Post deleted', { eventId }, 'TimelineComponent');
  }, []);

  // Filter out deleted events
  const visibleEvents = events.filter(event => !event.isDeleted);

  // Handle bulk delete with confirmation
  const handleBulkDeleteClick = useCallback(() => {
    setShowBulkDeleteConfirm(true);
  }, []);

  const handleBulkDeleteConfirm = useCallback(async () => {
    setShowBulkDeleteConfirm(false);
    const result = await bulkDelete(visibleEvents);

    if (!result.success && result.failureCount > 0) {
      if (result.successCount === 0) {
        showError('Failed to delete posts. Please try again.');
      } else {
        showError(
          `Deleted ${result.successCount} posts, but ${result.failureCount} failed.`
        );
      }
    }
  }, [bulkDelete, visibleEvents, showError]);

  // Handle bulk visibility change
  const handleBulkVisibilityChange = useCallback(
    async (visibility: TimelineVisibility) => {
      const result = await bulkSetVisibility(visibleEvents, visibility);

      if (!result.success && result.failureCount > 0) {
        if (result.successCount === 0) {
          showError('Failed to change visibility. Please try again.');
        } else {
          showError(
            `Changed ${result.successCount} posts, but ${result.failureCount} failed.`
          );
        }
      }
    },
    [bulkSetVisibility, visibleEvents, showError]
  );

  // Don't render anything if empty - let parent handle empty state
  if (visibleEvents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0">
      {/* Multi-Select Controls */}
      {enableMultiSelect && (
        <>
          {!isSelectionMode ? (
            // Entry point to selection mode - small button
            <div className="sticky top-16 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectionMode}
                className="flex items-center gap-2 text-sm"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Select Posts</span>
              </Button>
            </div>
          ) : (
            // Full bulk actions toolbar when in selection mode
            <BulkActionsToolbar
              selectedCount={selectedCount}
              totalCount={visibleEvents.length}
              isProcessing={isProcessing}
              onSelectAll={() => selectAll(visibleEvents)}
              onClearSelection={clearSelection}
              onExitSelectionMode={toggleSelectionMode}
              onBulkDelete={handleBulkDeleteClick}
              onBulkVisibilityChange={handleBulkVisibilityChange}
              className="top-16"
            />
          )}
        </>
      )}

      {/* Events List */}
      <div className="space-y-0">
        {visibleEvents.map(event => (
          <PostCard
            key={event.id}
            event={event}
            onUpdate={updates => handleEventUpdate(event.id, updates)}
            onDelete={() => handlePostDelete(event.id)}
            compact={compact}
            showMetrics={true}
            isSelectionMode={isSelectionMode}
            isSelected={isSelected(event.id)}
            onToggleSelect={toggleSelection}
          />
        ))}
      </div>

      {/* Load More */}
      {feed.pagination.hasNext && onLoadMore && (
        <div className="text-center pt-4 pb-6">
          <Button onClick={onLoadMore} variant="outline">
            Load More
          </Button>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Delete {selectedCount} {selectedCount === 1 ? 'post' : 'posts'}?
                  </h2>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{' '}
                {selectedCount === 1 ? 'this post' : 'these posts'}?
                {selectedCount > 1 && ' They will be'} permanently removed from your
                timeline.
              </p>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleBulkDeleteConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TimelineComponent;
