/**
 * Project Status Configuration - Single Source of Truth
 *
 * Centralized status definitions, labels, colors, and validation for projects.
 * All project status constants and helpers live here — import from this file only.
 *
 * Created: 2025-01-30
 * Last Modified: 2026-02-23
 * Last Modified Summary: Consolidated from lib/projectStatus.ts and database-constants.ts
 */

import { BADGE_COLORS } from '@/config/badge-colors';
import { STATUS_LABELS } from './status-labels';

/** String constants for project status comparisons (follows STATUS.* pattern) */
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

/**
 * Statuses a signed-out visitor can see. This mirrors the `projects_public_read`
 * RLS policy on the database (`status = 'active' OR status = 'completed' OR
 * user_id = auth.uid()`) — keep the two in step. Anything else is owner-only,
 * which means the owner is the only person who can act on it.
 */
export const PROJECT_PUBLICLY_VISIBLE_STATUSES: readonly string[] = [
  PROJECT_STATUS.ACTIVE,
  PROJECT_STATUS.COMPLETED,
];

/** True when the project is visible to people other than its owner. */
export function isProjectPubliclyVisible(status: string | null | undefined): boolean {
  return !!status && PROJECT_PUBLICLY_VISIBLE_STATUSES.includes(status);
}

export const PROJECT_STATUSES = {
  draft: {
    label: STATUS_LABELS.draft,
    className: `border ${BADGE_COLORS.muted}`,
    badgeVariant: 'default' as const,
  },
  active: {
    label: STATUS_LABELS.active,
    className: `border ${BADGE_COLORS.success}`,
    badgeVariant: 'success' as const,
  },
  paused: {
    label: STATUS_LABELS.paused,
    className: `border ${BADGE_COLORS.warning}`,
    badgeVariant: 'warning' as const,
  },
  completed: {
    label: STATUS_LABELS.completed,
    className: `border ${BADGE_COLORS.info}`,
    badgeVariant: 'info' as const,
  },
  cancelled: {
    label: STATUS_LABELS.cancelled,
    className: `border ${BADGE_COLORS.error}`,
    badgeVariant: 'error' as const,
  },
};

export type ProjectStatus = keyof typeof PROJECT_STATUSES;

/** All valid project status values */
export const VALID_PROJECT_STATUSES = [
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled',
] as const satisfies readonly ProjectStatus[];

/** Statuses visible in public search/discover */
export const PUBLIC_SEARCH_STATUSES: readonly ProjectStatus[] = ['active', 'paused'] as const;
