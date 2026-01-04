/**
 * Generic Update Payload Builder
 *
 * Eliminates duplication in buildUpdatePayload functions across entity routes.
 * Provides utilities for building update payloads with defaults and field mapping.
 *
 * Created: 2025-12-27
 * Last Modified: 2025-12-27
 * Last Modified Summary: Generic utility to consolidate buildUpdatePayload functions
 */

/**
 * Field mapping configuration for building update payloads
 */
export interface FieldMapping {
  /** Source field name (from validated data) */
  from: string;
  /** Target field name (in update payload) - defaults to same as source */
  to?: string;
  /** Default value if source is undefined/null */
  default?: unknown;
  /** Transform function to apply to the value */
  transform?: (value: unknown) => unknown;
}

/**
 * Build update payload from validated data using field mappings
 *
 * @param data - Validated entity data
 * @param mappings - Field mappings configuration
 * @param options - Additional options
 * @returns Update payload object
 *
 * @example
 * ```typescript
 * const payload = buildUpdatePayload(data, [
 *   { from: 'title' },
 *   { from: 'price_sats' },
 *   { from: 'currency', default: 'SATS' },
 *   { from: 'product_type', default: 'physical' },
 *   { from: 'images', default: [] },
 * ]);
 * ```
 */
export function buildUpdatePayload(
  data: Record<string, unknown>,
  mappings: FieldMapping[],
  options?: {
    /** Include fields that are undefined/null (default: false) */
    includeUndefined?: boolean;
    /** Additional fields to include (merged after mappings) */
    additionalFields?: Record<string, unknown>;
  }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const mapping of mappings) {
    const sourceValue = data[mapping.from];
    const targetKey = mapping.to ?? mapping.from;

    // Skip if undefined/null and not including undefined
    if (!options?.includeUndefined && (sourceValue === undefined || sourceValue === null)) {
      // Use default if provided
      if (mapping.default !== undefined) {
        payload[targetKey] = mapping.default;
      }
      continue;
    }

    // Use value, default, or undefined
    let value = sourceValue !== undefined && sourceValue !== null ? sourceValue : mapping.default;

    // Apply transform if provided
    if (value !== undefined && mapping.transform) {
      value = mapping.transform(value);
    }

    // Only include if value is defined (or includeUndefined is true)
    if (value !== undefined || options?.includeUndefined) {
      payload[targetKey] = value;
    }
  }

  // Merge additional fields
  if (options?.additionalFields) {
    Object.assign(payload, options.additionalFields);
  }

  return payload;
}

/**
 * Helper to create a buildUpdatePayload function for an entity
 *
 * @param mappings - Field mappings configuration
 * @returns buildUpdatePayload function
 *
 * @example
 * ```typescript
 * const buildProductUpdatePayload = createUpdatePayloadBuilder([
 *   { from: 'title' },
 *   { from: 'price_sats' },
 *   { from: 'currency', default: 'SATS' },
 * ]);
 * ```
 */
export function createUpdatePayloadBuilder(mappings: FieldMapping[]) {
  return (data: Record<string, unknown>, options?: Parameters<typeof buildUpdatePayload>[2]) => {
    return buildUpdatePayload(data, mappings, options);
  };
}



