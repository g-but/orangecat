/**
 * Project Status Configuration - Single Source of Truth
 *
 * Centralized status definitions for projects.
 * Used by all components that display project status.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created project statuses config
 */

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

/**
 * Get status configuration
 */
export function getProjectStatus(status: string): typeof PROJECT_STATUSES[keyof typeof PROJECT_STATUSES] {
  const normalized = status?.toLowerCase() as ProjectStatus;
  return PROJECT_STATUSES[normalized] || PROJECT_STATUSES.draft;
}


