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
 * Last Modified: 2026-01-05
 * Last Modified Summary: Support async transformData with supabase parameter for user preference access
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

// Type for the awaited Supabase client
type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

// ==================== TYPES ====================

export interface EntityPostHandlerConfig {
  /** Entity type from registry */
  entityType: EntityType;
  /** Zod schema for validation */
  schema: ZodSchema;
  /** Override table name (uses registry tableName if not specified) */
  tableName?: string;
  /** Function to transform validated data before insertion */
  transformData?: (
    data: Record<string, unknown>,
    userId: string,
    supabase: SupabaseClient
  ) => Record<string, unknown> | Promise<Record<string, unknown>>;
  /** Custom creation function (if entity has special creation logic) */
  createEntity?: (
    userId: string,
    data: Record<string, unknown>,
    supabase: SupabaseClient
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
  const { entityType, schema, tableName, transformData, createEntity, defaultFields = {} } = config;

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
      let transformedData;
      try {
        transformedData = transformData
          ? await Promise.resolve(transformData(ctx.body, user.id, supabase))
          : { ...ctx.body, user_id: user.id };
      } catch (transformError) {
        logger.error(`Error transforming data for ${entityType}`, {
          error: transformError,
          body: ctx.body,
          userId: user.id,
        });
        const errorMessage =
          transformError instanceof Error ? transformError.message : String(transformError);
        return apiInternalError(`Failed to process ${meta.name.toLowerCase()}: ${errorMessage}`);
      }

      const entityData = { ...transformedData, ...defaultFields };

      // Log the data being inserted for debugging
      logger.info(`Inserting ${entityType}`, {
        table,
        userId: user.id,
        dataKeys: Object.keys(entityData),
        entityDataSample: JSON.stringify(entityData, null, 2).substring(0, 500),
      });

      const { data: entity, error } = await supabase
        .from(table)
        .insert(entityData)
        .select()
        .single();

      if (error) {
        const errorDetails = {
          error,
          userId: user.id,
          table,
          code: error?.code,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          entityData: JSON.stringify(entityData, null, 2),
          // Also log the raw error object
          rawError: JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2),
        };
        logger.error(`Error creating ${entityType}`, errorDetails);
        // Return more detailed error message
        // Try to extract error message from various possible properties
        let errorMsg = 'Unknown error';
        if (error?.message) {
          errorMsg = error.message;
        } else if (error?.details) {
          errorMsg = error.details;
        } else if (error?.hint) {
          errorMsg = error.hint;
        } else if (error?.code) {
          errorMsg = `Database error code: ${error.code}`;
        } else if (typeof error === 'object') {
          // Try to stringify the error object to see its structure
          try {
            // Try with all own properties
            const errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
            if (errorStr !== '{}') {
              errorMsg = `Database error: ${errorStr.substring(0, 200)}`;
            } else {
              // Try to access common Supabase error properties directly
              const supabaseError = error as {
                code?: string;
                message?: string;
                details?: string;
                hint?: string;
              };
              const errorCode = supabaseError?.code;
              const errorMessageProp = supabaseError?.message;
              const errorDetails = supabaseError?.details;
              const errorHint = supabaseError?.hint;
              if (errorCode || errorMessageProp || errorDetails || errorHint) {
                errorMsg = `Database error: code=${errorCode || 'N/A'}, message=${errorMessageProp || 'N/A'}, details=${errorDetails || 'N/A'}, hint=${errorHint || 'N/A'}`;
              } else {
                errorMsg = `Database error: ${error?.toString?.() || String(error)}`;
              }
            }
          } catch {
            errorMsg = `Database error: ${String(error)}`;
          }
        } else {
          errorMsg = String(error);
        }
        return apiInternalError(`Failed to create ${meta.name.toLowerCase()}: ${errorMsg}`);
      }

      logger.info(`${meta.name} created successfully`, { [`${entityType}Id`]: entity.id });
      return apiSuccess(entity, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
