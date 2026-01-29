/**
 * Status Configuration - Single Source of Truth
 *
 * Centralized status labels and styling for all entity statuses.
 * Components should import from here instead of defining their own mappings.
 *
 * BENEFITS:
 * - Consistent status presentation across the app
 * - Easy to update labels/colors in one place
 * - Follows DRY and SSOT principles from CLAUDE.md
 *
 * Created: 2026-01-28
 */

// ==================== STATUS TYPES ====================

/**
 * Common entity statuses across the platform
 */
export type EntityStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'archived';

// ==================== STATUS CONFIG ====================

export interface StatusInfo {
  label: string;
  className: string;
  description?: string;
}

/**
 * Status configuration - SSOT for all status labels and styles
 */
export const STATUS_CONFIG: Record<EntityStatus, StatusInfo> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700',
    description: 'Not yet published',
  },
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-700',
    description: 'Live and visible',
  },
  paused: {
    label: 'Paused',
    className: 'bg-yellow-100 text-yellow-700',
    description: 'Temporarily inactive',
  },
  completed: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-700',
    description: 'Successfully finished',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700',
    description: 'No longer active',
  },
  archived: {
    label: 'Archived',
    className: 'bg-slate-100 text-slate-700',
    description: 'Stored for reference',
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get status info for any status string
 * Returns default styling for unknown statuses
 *
 * @example
 * const info = getStatusInfo('active');
 * // { label: 'Active', className: 'bg-green-100 text-green-700' }
 */
export function getStatusInfo(status: string | null | undefined): StatusInfo {
  if (!status) {
    return {
      label: 'Unknown',
      className: 'bg-gray-100 text-gray-700',
    };
  }

  const normalized = status.toLowerCase() as EntityStatus;
  return (
    STATUS_CONFIG[normalized] || {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      className: 'bg-gray-100 text-gray-700',
    }
  );
}

/**
 * Get just the status label
 */
export function getStatusLabel(status: string | null | undefined): string {
  return getStatusInfo(status).label;
}

/**
 * Get just the status className
 */
export function getStatusClassName(status: string | null | undefined): string {
  return getStatusInfo(status).className;
}

/**
 * Check if a status is considered "public" (visible to others)
 */
export function isPublicStatus(status: string | null | undefined): boolean {
  const publicStatuses: EntityStatus[] = ['active', 'completed'];
  return publicStatuses.includes((status?.toLowerCase() || '') as EntityStatus);
}

/**
 * Check if a status is considered "editable"
 */
export function isEditableStatus(status: string | null | undefined): boolean {
  const editableStatuses: EntityStatus[] = ['draft', 'active', 'paused'];
  return editableStatuses.includes((status?.toLowerCase() || '') as EntityStatus);
}

// ==================== STATUS LISTS ====================

/**
 * All possible statuses in display order
 */
export const ALL_STATUSES: EntityStatus[] = [
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled',
  'archived',
];

/**
 * Statuses that should be shown in public listings
 */
export const PUBLIC_STATUSES: EntityStatus[] = ['active'];

/**
 * Statuses that owners can see for their own entities
 */
export const OWNER_VISIBLE_STATUSES: EntityStatus[] = ['draft', 'active', 'paused', 'completed'];
