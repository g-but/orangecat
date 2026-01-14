/**
 * Entity Data Normalization Utilities
 *
 * Provides consistent data normalization for entity creation and updates.
 * Handles common issues like empty strings, null arrays, date formats, etc.
 *
 * Created: 2026-01-04
 * Last Modified: 2026-01-04
 * Last Modified Summary: Initial creation of entity data normalization utilities
 */

import { normalizeDate } from './helpers';

/**
 * Common transform functions for entity data normalization
 */
export const entityTransforms = {
  /**
   * Convert empty strings to null
   * Used for optional string fields that should be null in database
   */
  emptyStringToNull: (value: unknown): unknown => {
    return value === '' ? null : value;
  },

  /**
   * Convert null/undefined arrays to empty array
   * Used for array fields that should always be arrays
   */
  nullToEmptyArray: (value: unknown): unknown => {
    return value === null || value === undefined ? [] : value;
  },

  /**
   * Normalize date to ISO string or null
   * Handles both string and Date object inputs
   */
  normalizeDate: (value: unknown): string | null => {
    return normalizeDate(value as string | Date | null | undefined);
  },

  /**
   * Normalize UUID field (empty string -> null)
   * Used for UUID columns that reject empty strings
   */
  normalizeUUID: (value: unknown): string | null => {
    if (value === '' || value === null || value === undefined) {return null;}
    return typeof value === 'string' ? value : null;
  },

  /**
   * Normalize URL field (empty string -> null)
   * Used for URL columns that should be null if empty
   */
  normalizeURL: (value: unknown): string | null => {
    if (value === '' || value === null || value === undefined) {return null;}
    return typeof value === 'string' ? value : null;
  },

  /**
   * Normalize optional number (null/undefined -> null, keep 0)
   * Used for optional number fields
   */
  normalizeOptionalNumber: (value: unknown): number | null => {
    if (value === null || value === undefined) {return null;}
    return typeof value === 'number' ? value : null;
  },
};

/**
 * Normalize entity data for database insertion/update
 *
 * @param data - Entity data to normalize
 * @param config - Normalization configuration
 * @returns Normalized data
 */
export function normalizeEntityData<T extends Record<string, unknown>>(
  data: T,
  config?: {
    /** Fields that should be normalized from empty string to null */
    emptyStringFields?: string[];
    /** Fields that are UUIDs and should normalize empty strings to null */
    uuidFields?: string[];
    /** Fields that are URLs and should normalize empty strings to null */
    urlFields?: string[];
    /** Fields that are arrays and should normalize null to [] */
    arrayFields?: string[];
    /** Fields that are dates and should be normalized to ISO strings */
    dateFields?: string[];
    /** Whether to normalize ALL empty strings to null (default: false) */
    normalizeAllEmptyStrings?: boolean;
  }
): T {
  const normalized: Record<string, unknown> = { ...data };

  // Normalize specific empty string fields to null
  if (config?.emptyStringFields) {
    config.emptyStringFields.forEach(field => {
      if (field in normalized && normalized[field] === '') {
        normalized[field] = null;
      }
    });
  }

  // Normalize all empty strings to null if requested
  if (config?.normalizeAllEmptyStrings) {
    Object.keys(normalized).forEach(key => {
      if (typeof normalized[key] === 'string' && normalized[key] === '') {
        normalized[key] = null;
      }
    });
  }

  // Normalize UUID fields (empty string -> null)
  if (config?.uuidFields) {
    config.uuidFields.forEach(field => {
      if (field in normalized) {
        normalized[field] = entityTransforms.normalizeUUID(normalized[field]);
      }
    });
  }

  // Normalize URL fields (empty string -> null)
  if (config?.urlFields) {
    config.urlFields.forEach(field => {
      if (field in normalized) {
        normalized[field] = entityTransforms.normalizeURL(normalized[field]);
      }
    });
  }

  // Normalize array fields (null -> [])
  if (config?.arrayFields) {
    config.arrayFields.forEach(field => {
      if (field in normalized) {
        normalized[field] = entityTransforms.nullToEmptyArray(normalized[field]);
      }
    });
  }

  // Normalize date fields
  if (config?.dateFields) {
    config.dateFields.forEach(field => {
      if (field in normalized) {
        normalized[field] = entityTransforms.normalizeDate(normalized[field]);
      }
    });
  }

  return normalized as T;
}
