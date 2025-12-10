'use client';

import React, { useState, useCallback } from 'react';
import { TimelineDisplayEvent, TimelineFeedResponse } from '@/types/timeline';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/useToast';
import { PostCard } from './PostCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Trash2, X } from 'lucide-react';

interface TimelineComponentProps {
  feed: TimelineFeedResponse;
  onEventUpdate?: (eventId: string, updates: Partial<TimelineDisplayEvent>) => void;
  onLoadMore?: () => void;
  showFilters?: boolean;
  compact?: boolean;
  enableMultiSelect?: boolean; // Enable multi-select mode for bulk operations
}

interface TimelineEventProps {
  event: TimelineDisplayEvent;
  onUpdate: (updates: Partial<TimelineDisplayEvent>) => void;
  compact?: boolean;
  isSelected?: boolean; // For multi-select mode
  onToggleSelect?: (eventId: string) => void; // For multi-select mode
  selectionMode?: boolean; // Whether multi-select mode is active
  onAddEvent?: (event: TimelineDisplayEvent) => void; // For optimistic inserts (reposts/quotes)
}


// Simplified TimelineEventComponent using PostCard
const TimelineEventComponent: React.FC<TimelineEventProps> = ({
  event,
  onUpdate,
  compact = false,
  isSelected = false,
  onToggleSelect,
  selectionMode = false,
}) => {
  const handleDelete = useCallback(() => {
    logger.info('Post deleted', { eventId: event.id }, 'TimelineEventComponent');
  }, [event.id]);

  return (
    <PostCard
      event={event}
      onUpdate={onUpdate}
      onDelete={handleDelete}
      compact={compact}
      showMetrics={true}
    />
  );
};

export const TimelineComponent: React.FC<TimelineComponentProps> = ({
  feed,
  onEventUpdate,
  onLoadMore,
  showFilters = true,
  compact = false,
  enableMultiSelect = false,
}) => {
  const [events, setEvents] = useState(feed.events);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { success, error } = useToast();

  const handleEventUpdate = useCallback(
    (eventId: string, updates: Partial<TimelineDisplayEvent>) => {
      setEvents(prevEvents => {
        // If post is deleted, remove it from the list
        if (updates.isDeleted) {
          setSelectedEventIds(prev => {
            const next = new Set(prev);
            next.delete(eventId);
            return next;
          });
          return prevEvents.filter(event => event.id !== eventId);
        }
        // Otherwise, update it
        return prevEvents.map(event => (event.id === eventId ? { ...event, ...updates } : event));
      });
      onEventUpdate?.(eventId, updates);
    },
    [onEventUpdate]
  );

  // Note: Removed optimistic event addition to prevent hooks errors
  // New events should be handled by timeline refresh/refetch instead

  // Multi-select handlers
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev);
    setSelectedEventIds(new Set());
  }, []);

  const toggleEventSelection = useCallback((eventId: string) => {
    setSelectedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  // Filter out deleted events
  const visibleEvents = events.filter(event => !event.isDeleted);

  const selectAll = useCallback(() => {
    const visible = events.filter(event => !event.isDeleted);
    if (selectedEventIds.size === visible.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(visible.map(e => e.id)));
    }
  }, [events, selectedEventIds.size]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedEventIds.size === 0) {
      return;
    }

    // Store original state for rollback
    const originalEvents = [...events];
    const originalSelectedIds = new Set(selectedEventIds);

    // Optimistic update - remove events from UI immediately
    setEvents(prev => prev.filter(e => !selectedEventIds.has(e.id)));
    setSelectedEventIds(new Set());
    setShowBulkDeleteConfirm(false);
    setSelectionMode(false);

    try {
      setIsBulkDeleting(true);

      const deletePromises = Array.from(originalSelectedIds).map(eventId =>
        timelineService.deleteEvent(eventId, 'Bulk deleted by user')
      );

      // Use Promise.allSettled to handle partial failures
      const results = await Promise.allSettled(deletePromises);

      // Check for failures
      const failures = results.filter(result => result.status === 'rejected');
      const successes = results.filter(result => result.status === 'fulfilled');

      if (failures.length > 0) {
        logger.warn(`Bulk delete: ${successes.length} succeeded, ${failures.length} failed`, {
          failures: failures.map((f, i) => ({ eventId: Array.from(originalSelectedIds)[i], error: f.reason })),
        }, 'Timeline');

        // Rollback failed deletions
        const failedEventIds = failures.map((_, i) => Array.from(originalSelectedIds)[i]);
        const eventsToRestore = originalEvents.filter(e => failedEventIds.includes(e.id));

        setEvents(prev => {
          // Remove any events that were successfully deleted, keep the failed ones
          const successfulEventIds = successes.map((_, i) => Array.from(originalSelectedIds)[i]);
          const remainingEvents = prev.filter(e => !successfulEventIds.includes(e.id));
          // Add back the failed events
          return [...remainingEvents, ...eventsToRestore];
        });

        // Show appropriate error message
        if (successes.length === 0) {
          error('Failed to delete any posts. Please try again.');
        } else {
          error(`Deleted ${successes.length} posts, but ${failures.length} failed. The failed posts have been restored.`);
        }
      } else {
        logger.info(`Successfully bulk deleted ${successes.length} events`, null, 'Timeline');
      }
    } catch (error) {
      logger.error('Unexpected error during bulk delete', error, 'Timeline');

      // Rollback all changes on unexpected error
      setEvents(originalEvents);
      setSelectedEventIds(originalSelectedIds);
      setShowBulkDeleteConfirm(true);
      setSelectionMode(true);

      error('An unexpected error occurred. All changes have been reverted.');
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedEventIds, events]);

  // Don't render anything if empty - let parent handle empty state
  if (visibleEvents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0 sm:space-y-4">
      {/* Multi-Select Controls - Only show if enabled */}
      {enableMultiSelect && (
        <div className="sticky top-16 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 mb-4 sm:mb-0">
          <div className="flex items-center justify-between">
            {!selectionMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectionMode}
                className="flex items-center gap-2"
              >
                <span>Select Posts</span>
              </Button>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-sm">
                  {selectedEventIds.size === visibleEvents.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-sm text-gray-600">
                  {selectedEventIds.size} {selectedEventIds.size === 1 ? 'post' : 'posts'} selected
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    disabled={selectedEventIds.size === 0}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedEventIds.size})
                  </Button>
                  <Button variant="ghost" size="sm" onClick={toggleSelectionMode}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Events List - X/Twitter style: no spacing on mobile, spacing on desktop */}
      <div className="space-y-0">
        {visibleEvents.map(event => (
          <TimelineEventComponent
            key={event.id}
            event={event}
            onUpdate={updates => handleEventUpdate(event.id, updates)}
            compact={compact}
            isSelected={selectedEventIds.has(event.id)}
            onToggleSelect={toggleEventSelection}
            selectionMode={selectionMode}
          />
        ))}
      </div>

      {/* Load More */}
      {feed.pagination.hasNext && onLoadMore && (
        <div className="text-center pt-4">
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
                    Delete {selectedEventIds.size} {selectedEventIds.size === 1 ? 'post' : 'posts'}?
                  </h2>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{' '}
                {selectedEventIds.size === 1 ? 'this post' : 'these posts'}?
                {selectedEventIds.size > 1 && ' They will be'} permanently removed from your
                timeline.
              </p>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={isBulkDeleting}
                >
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                  {isBulkDeleting ? 'Deleting...' : 'Delete'}
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
export { TimelineEventComponent };
