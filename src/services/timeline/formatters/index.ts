/**
 * Timeline Formatters
 * 
 * Handles all display formatting and transformation logic for timeline events.
 * Single responsibility: Convert database events to display-ready format.
 * 
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted formatting logic from monolithic timeline service
 */

import type { LucideIcon } from 'lucide-react';
import {
  Heart,
  MessageCircle,
  Share2,
  Rocket,
  Zap,
  Trophy,
  Target,
  Bitcoin,
  User,
  Users,
  Star,
  TrendingUp,
  Calendar,
  Award,
  BookOpen,
  Plus,
  Minus,
} from 'lucide-react';
import type {
  TimelineEvent,
  TimelineEventType,
  TimelineEventDb,
  TimelineEventSubtype,
  TimelineActorType,
  TimelineSubjectType,
  TimelineVisibility,
} from '@/types/timeline';

/**
 * Helper to safely get a field that might be in snake_case or camelCase
 */
function getField<T>(obj: object, snakeCase: string, camelCase: string): T | undefined {
  const record = obj as Record<string, unknown>;
  return (record[snakeCase] as T) ?? (record[camelCase] as T) ?? undefined;
}

/**
 * Map database event to timeline event format
 */
export function mapDbEventToTimelineEvent(dbEvent: TimelineEventDb): TimelineEvent {
  return {
    id: dbEvent.id,
    eventType: dbEvent.event_type as TimelineEventType,
    eventSubtype: (dbEvent.event_subtype as TimelineEventSubtype) || undefined,
    actorId: getField<string>(dbEvent, 'actor_id', 'actorId') || '',
    actorType: (getField<string>(dbEvent, 'actor_type', 'actorType') as TimelineActorType) || 'user',
    subjectType: (getField<string>(dbEvent, 'subject_type', 'subjectType') as TimelineSubjectType) || 'profile',
    subjectId: getField<string>(dbEvent, 'subject_id', 'subjectId'),
    targetType: getField<string>(dbEvent, 'target_type', 'targetType') as TimelineSubjectType | undefined,
    targetId: getField<string>(dbEvent, 'target_id', 'targetId'),
    title: dbEvent.title,
    description: dbEvent.description || undefined,
    content: dbEvent.content,
    amountSats: dbEvent.amount_sats || undefined,
    amountBtc: dbEvent.amount_btc || undefined,
    quantity: dbEvent.quantity || undefined,
    locationData: dbEvent.location_data,
    deviceInfo: dbEvent.device_info,
    visibility: dbEvent.visibility as TimelineVisibility,
    isFeatured: dbEvent.is_featured,
    eventTimestamp: dbEvent.event_timestamp,
    createdAt: dbEvent.created_at,
    updatedAt: dbEvent.updated_at,
    metadata: dbEvent.metadata,
    tags: dbEvent.tags,
    parentEventId: dbEvent.parent_event_id || undefined,
    threadId: dbEvent.thread_id || undefined,
    isDeleted: dbEvent.is_deleted,
    deletedAt: dbEvent.deleted_at || undefined,
    deletionReason: dbEvent.deletion_reason || undefined,
  };
}

/**
 * Get icon for event type
 */
export function getEventIcon(eventType: TimelineEventType): LucideIcon {
  const iconMap: Record<TimelineEventType, LucideIcon> = {
    // Post events
    post_created: BookOpen,
    post_shared: Share2,
    post_liked: Heart,
    post_commented: MessageCircle,
    status_update: BookOpen,
    quote_reply: MessageCircle,
    achievement_shared: Trophy,
    reflection_posted: Star,

    // Project events
    project_created: Plus,
    project_published: Rocket,
    project_updated: TrendingUp,
    project_paused: Minus,
    project_resumed: Plus,
    project_completed: Target,
    project_cancelled: Minus,
    project_funded: Bitcoin,
    project_milestone: Target,
    project_goal_reached: Trophy,

    // Transaction events
    donation_received: Bitcoin,
    donation_sent: Share2,
    bitcoin_transaction: Bitcoin,
    lightning_payment: Zap,

    // Social events
    user_followed: User,
    user_unfollowed: User,
    project_liked: Heart,
    project_shared: Share2,
    comment_added: MessageCircle,
    comment_liked: Heart,
    profile_updated: User,
    verification_achieved: Award,

    // Community events
    organization_joined: Users,
    organization_left: Users,
    organization_created: Users,
    event_created: Calendar,
    event_attended: Calendar,
    collaboration_started: Users,

    // System events
    achievement_unlocked: Trophy,
    badge_earned: Award,
    level_up: TrendingUp,
    streak_maintained: Star,
  };

  return iconMap[eventType] || BookOpen;
}

/**
 * Get color for event type
 */
export function getEventColor(eventType: TimelineEventType): string {
  const colorMap: Record<string, string> = {
    project_created: 'blue',
    donation_received: 'green',
    user_followed: 'purple',
    project_completed: 'orange',
  };
  return colorMap[eventType] || 'gray';
}

/**
 * Get display type for event
 */
export function getEventDisplayType(eventType: TimelineEventType): string {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format amount for display
 */
export function formatAmount(event: TimelineEvent): string | undefined {
  if (event.amountBtc) {
    return `₿${event.amountBtc.toFixed(6)}`;
  }
  if (event.amountSats) {
    return `${event.amountSats.toLocaleString()} sats`;
  }
  return undefined;
}

/**
 * Get time ago string
 */
export function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now.getTime() - eventTime.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return eventTime.toLocaleDateString();
}

/**
 * Check if event is recent (within 24 hours)
 */
export function isEventRecent(timestamp: string): boolean {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffHours = (now.getTime() - eventTime.getTime()) / (1000 * 60 * 60);
  return diffHours < 24;
}

