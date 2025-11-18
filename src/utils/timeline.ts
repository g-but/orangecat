/**
 * TIMELINE UTILITIES - Timeline Processing and Deduplication
 *
 * This module provides utility functions for processing timeline events,
 * including cross-post deduplication and event grouping.
 *
 * Created: 2025-01-22
 */

import { TimelineDisplayEvent } from '@/types/timeline';

/**
 * Deduplicate cross-posted events
 * Groups events by their original post ID and keeps only the main post
 * with metadata about where it was cross-posted
 *
 * @param events - Array of timeline events
 * @returns Deduplicated array of events
 */
export function deduplicateCrossPosts(events: TimelineDisplayEvent[]): TimelineDisplayEvent[] {
  const eventGroups = new Map<string, TimelineDisplayEvent[]>();
  const standaloneEvents: TimelineDisplayEvent[] = [];

  // Group events by original_post_id
  for (const event of events) {
    const originalId = event.metadata?.original_post_id as string | undefined;
    if (originalId) {
      const group = eventGroups.get(originalId) || [];
      group.push(event);
      eventGroups.set(originalId, group);
    } else {
      standaloneEvents.push(event);
    }
  }

  // Process cross-post groups
  const deduplicatedEvents: TimelineDisplayEvent[] = [];

  for (const [originalId, group] of eventGroups) {
    // Find the original post (the one where id === original_post_id)
    const originalPost = group.find(e => e.id === originalId);

    if (originalPost) {
      // Keep the original post with cross-post metadata
      const crossPostTargets = group
        .filter(e => e.id !== originalId)
        .map(e => ({
          id: e.subject.id,
          name: e.subject.name,
          type: e.subject.type,
        }));

      deduplicatedEvents.push({
        ...originalPost,
        metadata: {
          ...originalPost.metadata,
          cross_posted_to: crossPostTargets,
        },
      });
    } else {
      // Original post not found, keep all cross-posts separately
      deduplicatedEvents.push(...group);
    }
  }

  // Add standalone events (not cross-posted)
  deduplicatedEvents.push(...standaloneEvents);

  // Sort by timestamp (most recent first)
  return deduplicatedEvents.sort((a, b) =>
    new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime()
  );
}

/**
 * Filter out optimistic events that have been replaced by real events
 * Uses content and timestamp matching to identify duplicates
 *
 * @param optimisticEvents - Array of optimistic (pending) events
 * @param realEvents - Array of real (confirmed) events from server
 * @param matchWindow - Time window in milliseconds for matching (default: 5000ms)
 * @returns Filtered array of optimistic events
 */
export function filterOptimisticEvents(
  optimisticEvents: any[],
  realEvents: any[],
  matchWindow: number = 5000
): any[] {
  return optimisticEvents.filter(optEvent =>
    !realEvents.some((realEvent: any) => {
      // Match by content and timestamp (simple heuristic)
      const contentMatches = realEvent.description === optEvent.description;
      const timestampDiff = Math.abs(
        new Date(realEvent.eventTimestamp).getTime() -
        new Date(optEvent.eventTimestamp).getTime()
      );

      return contentMatches && timestampDiff < matchWindow;
    })
  );
}
