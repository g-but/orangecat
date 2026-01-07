/**
 * Generic CRUD Handler for Entity Routes
 *
 * Provides reusable handlers for GET, PUT, DELETE operations on entities.
 * Uses the entity-registry as Single Source of Truth for metadata.
 *
 * Benefits:
 * - Eliminates code duplication across entity [id] routes
 * - Consistent error handling and logging
 * - Entity names derived from registry (no magic strings)
 * - Easy to add new entity types
 *
 * Created: 2025-12-25
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { ZodSchema, ZodError } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  handleApiError,
  handleSupabaseError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { rateLimit, rateLimitWrite, createRateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { type EntityType, getEntityMetadata } from '@/config/entity-registry';
import { checkOwnership } from '@/services/actors';

// ==================== TYPES ====================

export interface EntityHandlerConfig {
  /** Entity type from registry */
  entityType: EntityType;
  /** Zod schema for validation (optional for GET/DELETE) */
  schema?: ZodSchema;
  /** Function to build update payload from validated data */
  buildUpdatePayload?: (data: Record<string, unknown>) => Record<string, unknown>;
  /** Whether to check for 'active' status on public GET */
  requireActiveStatus?: boolean;
  /** Field name for ownership check (default: 'user_id', use 'actor_id' for unified ownership) */
  ownershipField?: string;
  /** Whether to use actor-based ownership check (requires actor_id field) */
  useActorOwnership?: boolean;
  /** Override table name (uses registry tableName if not specified) */
  tableName?: string;
  /** Whether GET requires authentication (default: false for public access) */
  requireAuthForGet?: boolean;
  /** Custom authorization check for GET (returns error response if unauthorized) */
  checkGetAccess?: (
    entity: Record<string, unknown>,
    userId: string | null,
    supabase: SupabaseClient
  ) => Promise<NextResponse | null>;
  /** Post-process entity after GET (add computed fields, etc.) */
  postProcessGet?: (
    entity: Record<string, unknown>,
    userId: string | null,
    supabase: SupabaseClient
  ) => Promise<Record<string, unknown>>;
  /** Custom authorization check for PUT (returns error response if unauthorized) */
  checkPutAccess?: (
    entity: Record<string, unknown>,
    userId: string,
    supabase: SupabaseClient
  ) => Promise<NextResponse | null>;
  /** Post-process entity after PUT (audit logging, etc.) */
  postProcessPut?: (
    entity: Record<string, unknown>,
    userId: string,
    supabase: SupabaseClient
  ) => Promise<void>;
  /** Custom authorization check for DELETE (returns error response if unauthorized) */
  checkDeleteAccess?: (
    entity: Record<string, unknown>,
    userId: string,
    supabase: SupabaseClient
  ) => Promise<NextResponse | null>;
  /** Pre-delete hook (cleanup operations, etc.) */
  preDelete?: (
    entity: Record<string, unknown>,
    userId: string,
    supabase: SupabaseClient
  ) => Promise<void>;
  /** Post-process after DELETE (audit logging, etc.) */
  postProcessDelete?: (
    entity: Record<string, unknown>,
    userId: string,
    supabase: SupabaseClient
  ) => Promise<void>;
  /** Custom cache control for GET */
  getCacheControl?: (entity: Record<string, unknown>, userId: string | null) => string;
}

export interface EntityRouteParams {
  params: { id: string };
}

// ==================== GET HANDLER ====================

/**
 * Generic GET handler for /api/[entity]/[id]
 *
 * Features:
 * - Rate limiting
 * - Optional status filtering
 * - Consistent error responses
 */
export function createGetHandler(config: EntityHandlerConfig) {
  const {
    entityType,
    requireActiveStatus = true,
    tableName,
    requireAuthForGet = false,
    ownershipField = 'user_id',
    checkGetAccess,
    postProcessGet,
    getCacheControl,
  } = config;
  const meta = getEntityMetadata(entityType);
  const table = tableName ?? meta.tableName;

  return async function GET(
    request: NextRequest,
    { params }: EntityRouteParams
  ) {
    try {
      // Rate limiting check
      const rateLimitResult = rateLimit(request);
      if (!rateLimitResult.success) {
        return createRateLimitResponse(rateLimitResult);
      }

      const supabase = await createServerClient();

      // Handle authentication (optional for GET)
      let userId: string | null = null;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {userId = user.id;}

      if (requireAuthForGet && !userId) {
        return apiUnauthorized();
      }

      const entityId = params.id;

      let query = supabase
        .from(table)
        .select('*')
        .eq('id', entityId);

      // If auth required, filter by ownership
      if (requireAuthForGet && userId) {
        if (useActorOwnership) {
          // For actor-based ownership, we need to get user's actor_id first
          // For now, fall back to user_id check if actor_id not available
          // This will be fully implemented once all entities have actor_id populated
          query = query.eq(ownershipField, userId);
        } else {
          query = query.eq(ownershipField, userId);
        }
      }

      if (requireActiveStatus) {
        query = query.eq('status', 'active');
      }

      const { data: entity, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return apiNotFound(`${meta.name} not found`);
        }
        return handleSupabaseError(error);
      }

      // Custom authorization check
      if (checkGetAccess) {
        const authError = await checkGetAccess(entity, userId, supabase);
        if (authError) {return authError;}
      }

      // Post-process entity (add computed fields, etc.)
      let processedEntity = entity;
      if (postProcessGet) {
        processedEntity = await postProcessGet(entity, userId, supabase);
      }

      // Custom cache control
      const cacheControl = getCacheControl
        ? getCacheControl(processedEntity, userId)
        : undefined;

      return apiSuccess(processedEntity, {
        headers: cacheControl ? { 'Cache-Control': cacheControl } : undefined,
      });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// ==================== PUT HANDLER ====================

/**
 * Generic PUT handler for /api/[entity]/[id]
 *
 * Features:
 * - Authentication check
 * - Ownership verification
 * - Rate limiting
 * - Zod validation
 * - Consistent error responses
 */
export function createPutHandler(config: EntityHandlerConfig) {
  const {
    entityType,
    schema,
    buildUpdatePayload,
    ownershipField = 'user_id',
    tableName,
    checkPutAccess,
    postProcessPut,
  } = config;
  const meta = getEntityMetadata(entityType);
  const table = tableName ?? meta.tableName;

  if (!schema) {
    throw new Error(`PUT handler for ${entityType} requires a schema`);
  }

  if (!buildUpdatePayload) {
    throw new Error(`PUT handler for ${entityType} requires buildUpdatePayload`);
  }

  return async function PUT(
    request: NextRequest,
    { params }: EntityRouteParams
  ) {
    try {
      const supabase = await createServerClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return apiUnauthorized();
      }

      const entityId = params.id;

      // Check if entity exists
      const { data: existing, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', entityId)
        .single();

      if (fetchError || !existing) {
        return apiNotFound(`${meta.name} not found`);
      }

      // Custom authorization check (if provided, use it; otherwise use default ownership check)
      if (checkPutAccess) {
        const authError = await checkPutAccess(existing, user.id, supabase);
        if (authError) {return authError;}
      } else {
        // Default ownership check
        if (config.useActorOwnership && existing.actor_id) {
          // Use actor-based ownership check
          const hasAccess = await checkOwnership(existing as { actor_id: string }, user.id);
          if (!hasAccess) {
            return apiUnauthorized(`You can only update your own ${meta.namePlural.toLowerCase()}`);
          }
        } else {
          // Use field-based ownership check
          const ownerId = (existing as Record<string, unknown>)[ownershipField];
          if (ownerId !== user.id) {
            return apiUnauthorized(`You can only update your own ${meta.namePlural.toLowerCase()}`);
          }
        }
      }

      // Rate limiting check
      const rateLimitResult = rateLimitWrite(user.id);
      if (!rateLimitResult.success) {
        const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
        return apiRateLimited('Too many update requests. Please slow down.', retryAfter);
      }

      const body = await request.json();
      const validatedData = schema.parse(body);
      const updatePayload = {
        ...buildUpdatePayload(validatedData),
        updated_at: new Date().toISOString(),
      };

      const { data: entity, error } = await supabase
        .from(table)
        .update(updatePayload)
        .eq('id', entityId)
        .select('*')
        .single();

      if (error) {
        logger.error(`${meta.name} update failed`, {
          userId: user.id,
          entityId,
          error: error.message,
          code: error.code,
        });
        return handleSupabaseError(error);
      }

      // Post-process (audit logging, etc.)
      if (postProcessPut) {
        await postProcessPut(entity, user.id, supabase);
      }

      logger.info(`${meta.name} updated successfully`, { userId: user.id, entityId });
      return apiSuccess(entity);
    } catch (error) {
      if (error instanceof ZodError) {
        return apiValidationError(`Invalid ${meta.name.toLowerCase()} data`, {
          details: error.errors,
        });
      }
      return handleApiError(error);
    }
  };
}

// ==================== DELETE HANDLER ====================

/**
 * Generic DELETE handler for /api/[entity]/[id]
 *
 * Features:
 * - Authentication check
 * - Ownership verification
 * - Consistent error responses
 */
export function createDeleteHandler(config: EntityHandlerConfig) {
  const {
    entityType,
    ownershipField = 'user_id',
    tableName,
    checkDeleteAccess,
    preDelete,
    postProcessDelete,
  } = config;
  const meta = getEntityMetadata(entityType);
  const table = tableName ?? meta.tableName;

  return async function DELETE(
    request: NextRequest,
    { params }: EntityRouteParams
  ) {
    try {
      const supabase = await createServerClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return apiUnauthorized();
      }

      const entityId = params.id;

      // Check if entity exists
      const { data: existing, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', entityId)
        .single();

      if (fetchError || !existing) {
        return apiNotFound(`${meta.name} not found`);
      }

      // Custom authorization check (if provided, use it; otherwise use default ownership check)
      if (checkDeleteAccess) {
        const authError = await checkDeleteAccess(existing, user.id, supabase);
        if (authError) {return authError;}
      } else {
        // Default ownership check
        const ownerId = (existing as Record<string, unknown>)[ownershipField];
        if (ownerId !== user.id) {
          return apiUnauthorized(`You can only delete your own ${meta.namePlural.toLowerCase()}`);
        }
      }

      // Pre-delete hook (cleanup operations)
      if (preDelete) {
        await preDelete(existing, user.id, supabase);
      }

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', entityId);

      if (error) {
        logger.error(`${meta.name} deletion failed`, {
          userId: user.id,
          entityId,
          error: error.message,
          code: error.code,
        });
        return handleSupabaseError(error);
      }

      // Post-process (audit logging, etc.)
      if (postProcessDelete) {
        await postProcessDelete(existing, user.id, supabase);
      }

      logger.info(`${meta.name} deleted successfully`, { userId: user.id, entityId });
      return apiSuccess({ message: `${meta.name} deleted successfully` });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// ==================== FACTORY FUNCTION ====================

/**
 * Create all CRUD handlers for an entity type
 *
 * Usage:
 * ```typescript
 * const { GET, PUT, DELETE } = createEntityCrudHandlers({
 *   entityType: 'product',
 *   schema: userProductSchema,
 *   buildUpdatePayload: (data) => ({
 *     title: data.title,
 *     price: data.price,
 *     // ... entity-specific fields
 *   }),
 * });
 *
 * export { GET, PUT, DELETE };
 * ```
 */
export function createEntityCrudHandlers(config: EntityHandlerConfig) {
  return {
    GET: createGetHandler(config),
    PUT: createPutHandler(config),
    DELETE: createDeleteHandler(config),
  };
}
