/**
 * Timeline Event Enrichment
 * 
 * Enriches timeline events with actor, subject, and target information.
 * 
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted enrichment logic from monolithic timeline service
 */

import supabase from '@/lib/supabase/browser';
import type {
  TimelineEvent,
  TimelineDisplayEvent,
  TimelineActorType,
  TimelineSubjectType,
  TimelineEventDb,
} from '@/types/timeline';
import {
  mapDbEventToTimelineEvent,
  getEventIcon,
  getEventColor,
  getEventDisplayType,
  formatAmount,
  getTimeAgo,
  isEventRecent,
} from '../formatters';

/**
 * Get actor information
 */
export async function getActorInfo(actorId: string): Promise<{
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  type: TimelineActorType;
}> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url')
    .eq('id', actorId)
    .single();

  return {
    id: actorId,
    name: profile?.display_name || profile?.username || 'Unknown User',
    username: profile?.username,
    avatar: profile?.avatar_url,
    type: 'user',
  };
}

/**
 * Get subject information
 */
export async function getSubjectInfo(
  type: TimelineSubjectType,
  id: string
): Promise<{ id: string; name: string; type: TimelineSubjectType; url?: string }> {
  switch (type) {
    case 'project':
      const { data: project } = await supabase
        .from('projects')
        .select('title')
        .eq('id', id)
        .single();
      return {
        id,
        name: project?.title || 'Unknown Project',
        type: 'project',
        url: `/projects/${id}`,
      };
    case 'profile':
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', id)
        .single();
      return {
        id,
        name: profile?.display_name || profile?.username || 'Unknown User',
        type: 'profile',
        url: `/profiles/${profile?.username || id}`,
      };
    default:
      return { id, name: `Unknown ${type}`, type };
  }
}

/**
 * Enrich events for display
 */
export async function enrichEventsForDisplay(events: unknown[]): Promise<TimelineDisplayEvent[]> {
  const enrichedEvents: TimelineDisplayEvent[] = [];

  for (const event of events) {
    const timelineEvent = mapDbEventToTimelineEvent(event as TimelineEventDb);

    // Enrich with actor info
    const actor = await getActorInfo(timelineEvent.actorId);
    const subject = timelineEvent.subjectId
      ? await getSubjectInfo(timelineEvent.subjectType, timelineEvent.subjectId)
      : undefined;
    const target = timelineEvent.targetId
      ? await getSubjectInfo(timelineEvent.targetType!, timelineEvent.targetId)
      : undefined;

    const displayEvent: TimelineDisplayEvent = {
      ...timelineEvent,
      icon: getEventIcon(timelineEvent.eventType),
      iconColor: getEventColor(timelineEvent.eventType),
      displayType: getEventDisplayType(timelineEvent.eventType),
      displaySubtype: timelineEvent.eventSubtype,
      actor,
      subject,
      target,
      formattedAmount: formatAmount(timelineEvent),
      timeAgo: getTimeAgo(timelineEvent.eventTimestamp),
      isRecent: isEventRecent(timelineEvent.eventTimestamp),
    } as TimelineDisplayEvent;

    enrichedEvents.push(displayEvent);
  }

  return enrichedEvents;
}

