/**
 * Project Activity Configuration — Single Source of Truth
 *
 * "Recent Activity" on a project page renders timeline events, which is the one
 * store project activity actually lands in — including everything sibling
 * products publish through the external bus (see config/external-publish.ts).
 *
 * This file owns the mapping from the timeline taxonomy to the three display
 * kinds the card knows how to draw, so the server and the component agree on
 * one vocabulary instead of each hardcoding event-type strings.
 *
 * Created: 2026-08-24
 */

import type { TimelineEventType } from '@/types/timeline';

/** How a piece of activity is drawn (icon + tint) in the Recent Activity card. */
export const PROJECT_ACTIVITY_KINDS = ['update', 'donation', 'milestone'] as const;
export type ProjectActivityKind = (typeof PROJECT_ACTIVITY_KINDS)[number];

/** Anything not listed here is an ordinary update. */
const ACTIVITY_KIND_BY_EVENT_TYPE = {
  project_milestone: 'milestone',
  project_goal_reached: 'milestone',
  project_completed: 'milestone',
  project_published: 'milestone',
  project_funded: 'donation',
} as const satisfies Partial<Record<TimelineEventType, ProjectActivityKind>>;

/**
 * An event carrying money is a donation regardless of its type — the amount is
 * the honest signal, and it is what the card puts in Bitcoin orange.
 */
export function projectActivityKind(
  eventType: string,
  amountBtc?: number | null
): ProjectActivityKind {
  if (amountBtc !== null && amountBtc !== undefined && amountBtc > 0) {
    return 'donation';
  }
  return (
    ACTIVITY_KIND_BY_EVENT_TYPE[eventType as keyof typeof ACTIVITY_KIND_BY_EVENT_TYPE] ?? 'update'
  );
}

/** How many items the card shows. */
export const PROJECT_ACTIVITY_LIMIT = 10;

/** One item as the API returns it and the card renders it. */
export interface ProjectActivityItem {
  id: string;
  project_id: string;
  type: ProjectActivityKind;
  title: string;
  content?: string;
  amount_btc?: number;
  created_at: string;
  /** Present when the update came from a sibling product via the publish bus. */
  source?: { label: string; url?: string };
}
