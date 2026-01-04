/**
 * API Helper Utilities
 *
 * Shared utilities for API handlers that promote simplicity and reliability.
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Initial creation of API helper utilities
 */

/**
 * Get cache control header based on query type
 *
 * @param isUserSpecific - Whether the query is user-specific
 * @returns Cache-Control header value
 */
export function getCacheControl(isUserSpecific: boolean): string {
  return isUserSpecific
    ? 'private, no-cache, no-store, must-revalidate'
    : 'public, s-maxage=60, stale-while-revalidate=300';
}

/**
 * Normalize date value to ISO string
 * Handles both string and Date object inputs
 *
 * @param value - Date value (string, Date, or null/undefined)
 * @returns ISO string or null
 */
export function normalizeDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return null;
}

/**
 * Normalize multiple date fields in an object
 *
 * @param data - Object with date fields
 * @param dateFields - Array of field names that are dates
 * @returns Object with normalized dates
 */
export function normalizeDates<T extends Record<string, unknown>>(
  data: T,
  dateFields: string[]
): T {
  const normalized = { ...data };
  for (const field of dateFields) {
    if (field in normalized) {
      normalized[field] = normalizeDate(normalized[field] as string | Date | null) as T[keyof T];
    }
  }
  return normalized;
}

/**
 * Calculate page number from offset and limit
 *
 * @param offset - Current offset
 * @param limit - Page size
 * @returns Page number (1-indexed)
 */
export function calculatePage(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1;
}

