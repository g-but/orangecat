/**
 * Timeline Query Helpers
 *
 * Helper functions for timeline feed queries.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from feeds.ts
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type { TimelineDisplayEvent } from '@/types/timeline';
import type { TimelineActorType } from '@/types/timeline';
import { mapDbEventToTimelineEvent, getEventIcon, getEventColor, getEventDisplayType, formatAmount, getTimeAgo, isEventRecent } from '@/services/timeline/formatters';

/**
 * Get current user ID helper
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    logger.error('Error getting current user ID', error, 'Timeline');
    return null;
  }
}

/**
 * Helper to transform enriched view events to display events
 */
export function transformEnrichedEventToDisplay(event: any): TimelineDisplayEvent {
  const timelineEvent = mapDbEventToTimelineEvent(event);

  // Omit eventType and eventSubtype as TimelineDisplayEvent extends Omit<TimelineEvent, 'eventType' | 'eventSubtype'>
  const { eventType, eventSubtype, ...eventWithoutTypes } = timelineEvent;

  return {
    ...eventWithoutTypes,
    icon: getEventIcon(timelineEvent.eventType),
    iconColor: getEventColor(timelineEvent.eventType),
    displayType: getEventDisplayType(timelineEvent.eventType),
    displaySubtype: timelineEvent.eventSubtype,
    // Actor, subject, target data already pre-joined in VIEW
    actor: event.actor_data
      ? {
          id: event.actor_data.id,
          name: event.actor_data.display_name || event.actor_data.username || 'Unknown',
          username: event.actor_data.username,
          avatar: event.actor_data.avatar_url,
          type: 'user' as TimelineActorType,
        }
      : undefined,
    subject: event.subject_data
      ? {
          id: event.subject_data.id,
          name:
            event.subject_data.type === 'profile'
              ? event.subject_data.display_name || event.subject_data.username
              : event.subject_data.title,
          type: event.subject_data.type,
          url:
            event.subject_data.type === 'profile'
              ? `/profiles/${event.subject_data.username || event.subject_data.id}`
              : `/projects/${event.subject_data.id}`,
        }
      : undefined,
    target: event.target_data
      ? {
          id: event.target_data.id,
          name:
            event.target_data.type === 'profile'
              ? event.target_data.display_name || event.target_data.username
              : event.target_data.title,
          type: event.target_data.type,
          url:
            event.target_data.type === 'profile'
              ? `/profiles/${event.target_data.username || event.target_data.id}`
              : `/projects/${event.target_data.id}`,
        }
      : undefined,
    formattedAmount: formatAmount(timelineEvent),
    timeAgo: getTimeAgo(timelineEvent.eventTimestamp),
    isRecent: isEventRecent(timelineEvent.eventTimestamp),
  };
}

