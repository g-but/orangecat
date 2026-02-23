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

/** String constants for project status comparisons (follows STATUS.* pattern) */
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PROJECT_STATUSES = {
  draft: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-700 border border-slate-200',
    badgeVariant: 'default' as const,
    color: 'slate',
  },
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-700 border border-green-200',
    badgeVariant: 'success' as const,
    color: 'green',
  },
  paused: {
    label: 'Paused',
    className: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    badgeVariant: 'warning' as const,
    color: 'yellow',
  },
  completed: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-700 border border-blue-200',
    badgeVariant: 'info' as const,
    color: 'blue',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700 border border-red-200',
    badgeVariant: 'error' as const,
    color: 'red',
  },
} as const;

export type ProjectStatus = keyof typeof PROJECT_STATUSES;

/** All valid project status values */
export const VALID_PROJECT_STATUSES: readonly ProjectStatus[] = [
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled',
] as const;

/** Statuses visible in public search/discover */
export const PUBLIC_SEARCH_STATUSES: readonly ProjectStatus[] = ['active', 'paused'] as const;

/** Get status display configuration (label, colors, badge variant) */
export function getProjectStatus(
  status: string
): (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES] {
  const normalized = status?.toLowerCase() as ProjectStatus;
  return PROJECT_STATUSES[normalized] || PROJECT_STATUSES.draft;
}

/** Type guard: check if a string is a valid ProjectStatus */
export function isValidProjectStatus(status: string): status is ProjectStatus {
  return VALID_PROJECT_STATUSES.includes(status as ProjectStatus);
}
