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
  // Group events by original_post_id
  const eventGroups = new Map<string, TimelineDisplayEvent[]>();
  const standaloneEvents: TimelineDisplayEvent[] = [];

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
  const deduplicatedEvents: TimelineDisplayEvent[] = [];
  eventGroups.forEach((group, _mainPostId) => {
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
            project_name: cp.metadata?.project_name,
          })),
        },
      });
    } else if (group.length > 0) {
      // If no main post found, just use the first one
      deduplicatedEvents.push(group[0]);
    }
  });

  // Combine standalone and deduplicated events, then sort by timestamp
  const allEvents = [...standaloneEvents, ...deduplicatedEvents].sort((a, b) => {
    return new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime();
  });

  return allEvents;
}

/**
 * Merge optimistic events with real events, removing duplicates
 * Matches events by content and timestamp within a 5-second window
 *
 * @param optimisticEvents - Array of optimistic (not yet confirmed) events
 * @param realEvents - Array of confirmed events from the server
 * @returns Filtered optimistic events that haven't been replaced
 */
export function filterOptimisticEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  optimisticEvents: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  realEvents: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  return optimisticEvents.filter(optEvent =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !realEvents.some((realEvent: any) => {
      // Match by content and timestamp (simple heuristic)
      return realEvent.description === optEvent.description &&
             Math.abs(
               new Date(realEvent.eventTimestamp).getTime() -
               new Date(optEvent.eventTimestamp).getTime()
             ) < 5000; // 5 second window
    })
  );
}
