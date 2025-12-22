/**
 * @deprecated This component is no longer used.
 *
 * Multi-select functionality has been integrated into TimelineComponent
 * via the enableMultiSelect prop. This component is kept for reference
 * but should not be used in new code.
 *
 * See: TimelineComponent with enableMultiSelect prop for multi-select support.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import TimelineComposer from '@/components/timeline/TimelineComposer';
import { PostCard } from '@/components/timeline/PostCard';
import { timelineService } from '@/services/timeline';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2, X } from 'lucide-react';
import type { TimelineDisplayEvent } from '@/types/timeline';
import type { Profile } from '@/types/database';

interface TimelineSidePanelProps {
  profile: Profile;
  isOwnProfile: boolean;
}

export function TimelineSidePanel({ profile, isOwnProfile }: TimelineSidePanelProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineDisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load timeline events
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await timelineService.getProfileFeed(
        profile.id,
        { visibility: isOwnProfile ? undefined : ['public'] },
        { page: 1, limit: 10 }
      );

      setEvents(response.events || []);
    } catch (err) {
      console.error('Error loading timeline events:', err);
      setError('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [profile.id, isOwnProfile]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Handle post created
  const handlePostCreated = useCallback(() => {
    loadEvents();
    setShowComposer(false);
  }, [loadEvents]);

  // Handle event update (delete, edit, etc.)
  const handleEventUpdate = useCallback(
    (eventId: string, updates: Partial<TimelineDisplayEvent>) => {
      if (updates.isDeleted) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        setSelectedEventIds(prev => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
      } else {
        setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, ...updates } : e)));
      }
    },
    []
  );

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev);
    setSelectedEventIds(new Set());
  }, []);

  // Toggle event selection
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

  // Select all events
  const selectAll = useCallback(() => {
    if (selectedEventIds.size === events.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(events.map(e => e.id)));
    }
  }, [events, selectedEventIds.size]);

  // Bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedEventIds.size === 0) {
      return;
    }

    try {
      setIsDeleting(true);

      // Delete all selected events
      const deletePromises = Array.from(selectedEventIds).map(eventId =>
        timelineService.deleteEvent(eventId)
      );

      await Promise.all(deletePromises);

      // Remove deleted events from UI
      setEvents(prev => prev.filter(e => !selectedEventIds.has(e.id)));
      setSelectedEventIds(new Set());
      setShowDeleteConfirm(false);
      setSelectionMode(false);
    } catch (err) {
      console.error('Error deleting events:', err);
      setError('Failed to delete some posts');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedEventIds]);

  // Cancel selection
  const cancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedEventIds(new Set());
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Timeline</h3>

          {isOwnProfile && (
            <div className="flex items-center gap-2">
              {!selectionMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComposer(!showComposer)}
                    aria-label="Create post"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {events.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleSelectionMode}
                      aria-label="Select posts"
                    >
                      Select
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    {selectedEventIds.size === events.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={selectedEventIds.size === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                    {selectedEventIds.size > 0 && (
                      <span className="ml-1">({selectedEventIds.size})</span>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelSelection}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Post Composer */}
        {showComposer && isOwnProfile && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <TimelineComposer
              targetOwnerId={profile.id}
              targetOwnerType="profile"
              allowProjectSelection={true}
              onPostCreated={handlePostCreated}
            />
          </div>
        )}

        {/* Timeline Events */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">Loading timeline...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <Button variant="outline" size="sm" onClick={loadEvents} className="mt-2">
                Retry
              </Button>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">
                {isOwnProfile ? 'No posts yet. Create your first post!' : 'No posts yet.'}
              </p>
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="relative">
                {selectionMode && (
                  <div className="absolute left-4 top-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedEventIds.has(event.id)}
                      onChange={() => toggleEventSelection(event.id)}
                      className="h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      aria-label={`Select post: ${event.title}`}
                    />
                  </div>
                )}
                <div className={selectionMode ? 'pl-8' : ''}>
                  <PostCard
                    event={event}
                    onUpdate={updates => handleEventUpdate(event.id, updates)}
                    compact={true}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* View All Link */}
        {events.length > 0 && (
          <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Navigate to timeline tab
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'timeline');
                window.history.pushState({}, '', url);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
            >
              View All Posts
            </Button>
          </div>
        )}
      </CardContent>

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete {selectedEventIds.size} {selectedEventIds.size === 1 ? 'post' : 'posts'}?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone. The selected posts will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleBulkDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
