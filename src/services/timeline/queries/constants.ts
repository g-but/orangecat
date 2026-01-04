/**
 * Timeline Query Constants
 *
 * Constants for timeline feed queries.
 * Single Source of Truth for timeline table and view names.
 *
 * Created: 2025-01-30
 * Last Modified: 2026-01-03
 * Last Modified Summary: Added TIMELINE_TABLES constants for SSOT compliance
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Timeline table and view names
 * Single Source of Truth - all timeline queries should use these constants
 * instead of hardcoded strings to comply with SSOT principle
 */
export const TIMELINE_TABLES = {
  /** Main timeline events table */
  EVENTS: 'timeline_events',
  /** Enriched timeline events view (includes actor, subject, target data) */
  ENRICHED_VIEW: 'enriched_timeline_events',
  /** Community timeline view (no duplicate cross-posts) */
  COMMUNITY_VIEW: 'community_timeline_no_duplicates',
} as const;


