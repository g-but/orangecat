/**
 * Generic Entity POST Handler
 *
 * Provides reusable POST handler for entity creation endpoints.
 * Handles auth, rate limiting, validation, and database insertion.
 *
 * Benefits:
 * - Eliminates duplication across entity creation routes
 * - Consistent error handling
 * - Automatic rate limiting
 * - Type-safe validation
 * - Easy to add new entity types
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Initial creation of generic entity POST handler
 */

import { NextRequest } from 'next/server';
import { ZodSchema } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiInternalError,
  handleApiError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { compose } from '@/lib/api/compose';
import { withZodBody } from '@/lib/api/withZod';
import { withRequestId } from '@/lib/api/withRequestId';
import { rateLimitWrite } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { type EntityType, getEntityMetadata } from '@/config/entity-registry';

// ==================== TYPES ====================

export interface EntityPostHandlerConfig {
  /** Entity type from registry */
  entityType: EntityType;
  /** Zod schema for validation */
  schema: ZodSchema;
  /** Override table name (uses registry tableName if not specified) */
  tableName?: string;
  /** Function to transform validated data before insertion */
  transformData?: (data: Record<string, unknown>, userId: string) => Record<string, unknown>;
  /** Custom creation function (if entity has special creation logic) */
  createEntity?: (
    userId: string,
    data: Record<string, unknown>,
    supabase: ReturnType<typeof createServerClient>
  ) => Promise<Record<string, unknown>>;
  /** Additional fields to set on insert (e.g., current_attendees: 0) */
  defaultFields?: Record<string, unknown>;
}

// ==================== HANDLER FACTORY ====================

/**
 * Creates a POST handler for entity creation endpoints
 *
 * @example
 * ```typescript
 * export const POST = createEntityPostHandler({
 *   entityType: 'event',
 *   schema: eventSchema,
 *   transformData: (data, userId) => ({
 *     ...data,
 *     user_id: userId,
 *     start_date: typeof data.start_date === 'string' ? data.start_date : data.start_date?.toISOString(),
 *   }),
 *   defaultFields: { current_attendees: 0 },
 * });
 * ```
 */
export function createEntityPostHandler(config: EntityPostHandlerConfig) {
  const {
    entityType,
    schema,
    tableName,
    transformData,
    createEntity,
    defaultFields = {},
  } = config;

  const meta = getEntityMetadata(entityType);
  const table = tableName ?? meta.tableName;

  return compose(
    withRequestId(),
    withZodBody(schema)
  )(async (request: NextRequest, ctx) => {
    try {
      const supabase = await createServerClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return apiUnauthorized();
      }

      // Rate limiting
      const rateLimit = rateLimitWrite(user.id);
      if (!rateLimit.success) {
        const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
        logger.warn(`${meta.name} creation rate limit exceeded`, { userId: user.id });
        return apiRateLimited(
          `Too many ${meta.name.toLowerCase()} creation requests. Please slow down.`,
          retryAfter
        );
      }

      // Use custom creation function if provided (for domain services)
      if (createEntity) {
        const entity = await createEntity(user.id, ctx.body, supabase);
        logger.info(`${meta.name} created successfully`, { [`${entityType}Id`]: entity.id });
        return apiSuccess(entity, { status: 201 });
      }

      // Default creation: transform data and insert
      const transformedData = transformData 
        ? transformData(ctx.body, user.id) 
        : { ...ctx.body, user_id: user.id };
      
      const entityData = { ...transformedData, ...defaultFields };

      const { data: entity, error } = await supabase
        .from(table)
        .insert(entityData)
        .select()
        .single();

      if (error) {
        logger.error(`Error creating ${entityType}`, { error, userId: user.id, table });
        return apiInternalError(`Failed to create ${meta.name.toLowerCase()}`);
      }

      logger.info(`${meta.name} created successfully`, { [`${entityType}Id`]: entity.id });
      return apiSuccess(entity, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

