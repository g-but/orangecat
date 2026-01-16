/**
 * Project Utility Functions
 *
 * Reusable utilities for processing project data following DRY principles.
 *
 * Created: 2025-11-02
 * Last Modified: 2025-11-02
 * Last Modified Summary: Initial creation for category deduplication utility
 */

/**
 * Get unique categories from a project's category and tags.
 * Combines the main category with tags, deduplicates case-insensitively,
 * and returns a clean array of unique category strings.
 *
 * @param category - Main project category (optional)
 * @param tags - Array of project tags (optional)
 * @param options - Configuration options
 * @param options.limit - Maximum number of categories to return (default: undefined, no limit)
 * @param options.caseSensitive - Whether to treat case differences as unique (default: false)
 * @returns Array of unique category strings
 *
 * @example
 * ```typescript
 * // Basic usage
 * getUniqueCategories('charity', ['health', 'charity', 'humanitarian'])
 * // Returns: ['charity', 'health', 'humanitarian']
 *
 * // With limit
 * getUniqueCategories('charity', ['health', 'charity'], { limit: 2 })
 * // Returns: ['charity', 'health']
 * ```
 */
export function getUniqueCategories(
  category: string | null | undefined,
  tags: string[] | null | undefined,
  options: {
    limit?: number;
    caseSensitive?: boolean;
  } = {}
): string[] {
  const { limit, caseSensitive = false } = options;

  // Combine category and tags into a single array
  const allCategories: (string | null | undefined)[] = [];

  if (category) {
    allCategories.push(category);
  }

  if (Array.isArray(tags)) {
    allCategories.push(...tags);
  }

  // Deduplicate using a Set with case-insensitive keys
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of allCategories) {
    // Skip null, undefined, or empty strings
    if (!item) {
      continue;
    }

    // Trim whitespace
    const trimmed = item.trim();
    if (!trimmed) {
      continue;
    }

    // Create comparison key (lowercase for case-insensitive comparison)
    const key = caseSensitive ? trimmed : trimmed.toLowerCase();

    // Check if we've seen this category (case-insensitively)
    if (!seen.has(key)) {
      seen.add(key);
      // Preserve original casing from first occurrence
      result.push(trimmed);

      // Apply limit if specified
      if (limit !== undefined && result.length >= limit) {
        break;
      }
    }
  }

  return result;
}

/**
 * Type guard to check if an object has category and tags properties
 */
export function hasCategoryAndTags(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any
): obj is { category?: string | null; tags?: string[] | null } {
  return obj !== null && typeof obj === 'object' && ('category' in obj || 'tags' in obj);
}
