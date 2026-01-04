/**
 * Project Status Constants - Single Source of Truth
 *
 * Centralized definition of valid project status values.
 * Use these constants instead of magic strings throughout the codebase.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created SSOT for project status values
 */

export const PROJECT_STATUSES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];

/**
 * Valid status values array (for validation, filtering, etc.)
 */
export const VALID_PROJECT_STATUSES: readonly ProjectStatus[] = [
  PROJECT_STATUSES.DRAFT,
  PROJECT_STATUSES.ACTIVE,
  PROJECT_STATUSES.PAUSED,
  PROJECT_STATUSES.COMPLETED,
  PROJECT_STATUSES.CANCELLED,
] as const;

/**
 * Statuses that should appear in public search/discover
 */
export const PUBLIC_SEARCH_STATUSES: readonly ProjectStatus[] = [
  PROJECT_STATUSES.ACTIVE,
  PROJECT_STATUSES.PAUSED,
] as const;

/**
 * Check if a status is valid
 */
export function isValidProjectStatus(status: string): status is ProjectStatus {
  return VALID_PROJECT_STATUSES.includes(status as ProjectStatus);
}


