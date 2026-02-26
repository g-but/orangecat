/**
 * Generic Entity List Handler
 *
 * Provides reusable GET handler for entity list endpoints.
 * Handles pagination, filtering, draft visibility, and caching.
 *
 * Benefits:
 * - Eliminates duplication across entity list routes
 * - Consistent pagination and filtering
 * - Automatic draft visibility logic
 * - Consistent cache control
 * - Easy to add new entity types
 *
 * Created: 2025-01-28
 * Last Modified: 2026-01-06
 * Last Modified Summary: Added userIdField, publicFilters, requireAuth, selectColumns config options
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, handleApiError } from '@/lib/api/standardResponse';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { getPagination, getString } from '@/lib/api/query';
import { logger } from '@/utils/logger';
import { type EntityType, getEntityMetadata, ENTITY_REGISTRY } from '@/config/entity-registry';
import { listEntitiesPage } from '@/domain/commerce/service';
import { getCacheControl, calculatePage } from './helpers';
import { getAuthenticatedUserId, shouldIncludeDrafts } from './authHelpers';
import { getOrCreateUserActor } from '@/services/actors/getOrCreateUserActor';

// ==================== TYPES ====================

export interface EntityListHandlerConfig {
  /** Entity type from registry */
  entityType: EntityType;
  /** Override table name (uses registry tableName if not specified) */
  tableName?: string;
  /** Status values for public listings (default: ['active']) */
  publicStatuses?: string[];
  /** Status values for draft listings (default: includes 'draft') */
  draftStatuses?: string[];
  /** Default order field (default: 'created_at') */
  orderBy?: string;
  /** Order direction (default: 'desc') */
  orderDirection?: 'asc' | 'desc';
  /** Additional filters to apply (field -> value) */
  additionalFilters?: Record<string, string>;
  /** Whether to use listEntitiesPage helper (for commerce entities) */
  useListHelper?: boolean;
  /** Custom user ID field name (default: 'user_id') - e.g., 'owner_id' for assets */
  userIdField?: string;
  /** Additional filters for public listings (e.g., { is_public: true } for AI assistants) */
  publicFilters?: Record<string, unknown>;
  /** Whether authentication is required (default: false) */
  requireAuth?: boolean;
  /** Select specific columns (default: '*') */
  selectColumns?: string;
}

// ==================== HANDLER FACTORY ====================

/**
 * Creates a GET handler for entity list endpoints
 *
 * @example
 * ```typescript
 * export const GET = createEntityListHandler({
 *   entityType: 'product',
 *   useListHelper: true, // Uses listEntitiesPage for commerce entities
 * });
 * ```
 */
export function createEntityListHandler(config: EntityListHandlerConfig) {
  const {
    entityType,
    tableName,
    publicStatuses = ['active'],
    draftStatuses: _draftStatuses = ['draft', 'active'],
    orderBy = 'created_at',
    orderDirection = 'desc',
    additionalFilters = {},
    useListHelper = false,
    userIdField = 'user_id',
    publicFilters = {},
    requireAuth = false,
    selectColumns = '*',
  } = config;

  const meta = getEntityMetadata(entityType);
  const table = tableName ?? meta.tableName;

  return compose(
    withRequestId(),
    withRateLimit('read')
  )(async (request: NextRequest) => {
    try {
      const supabase = await createServerClient();
      const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });
      const category = getString(request.url, 'category');
      const userId = getString(request.url, 'user_id');

      // Check draft visibility
      const authenticatedUserId = await getAuthenticatedUserId();

      // If auth is required, check it first
      if (requireAuth && !authenticatedUserId) {
        return apiSuccess([], {
          page: calculatePage(offset, limit),
          limit,
          total: 0,
          headers: { 'Cache-Control': 'private, no-cache' },
        });
      }

      const includeOwnDrafts = await shouldIncludeDrafts(userId ?? null, authenticatedUserId);

      // Use listEntitiesPage helper for commerce entities
      // Derive commerce table names from entity registry (SSOT)
      const commerceEntityTypes: EntityType[] = ['product', 'service', 'cause'];
      const commerceTables = commerceEntityTypes.map(
        type => ENTITY_REGISTRY[type].tableName
      ) as readonly string[];

      if (useListHelper && commerceTables.includes(table)) {
        const { items, total } = await listEntitiesPage(
          table as 'user_products' | 'user_services' | 'user_causes',
          {
            limit,
            offset,
            category,
            userId,
            includeOwnDrafts,
          }
        );

        return apiSuccess(items, {
          page: calculatePage(offset, limit),
          limit,
          total,
          headers: {
            'Cache-Control': getCacheControl(!!userId),
          },
        });
      }

      // Build custom query for entities that don't use listEntitiesPage
      let query = supabase.from(table).select(selectColumns, { count: 'exact' });

      // Apply filters in correct order for RLS compatibility
      // When filtering by user_id (or custom userIdField), apply it first
      if (userId) {
        // When userIdField is 'actor_id', the query param is a user UUID
        // that needs to be resolved to an actor UUID first
        let filterValue = userId;
        if (userIdField === 'actor_id') {
          const actor = await getOrCreateUserActor(userId);
          filterValue = actor.id;
        }
        query = query.eq(userIdField, filterValue);
        // For own items, only filter by status if includeOwnDrafts is false
        if (!includeOwnDrafts) {
          query = query.in('status', publicStatuses);
        }
      } else if (requireAuth && authenticatedUserId) {
        // For auth-required routes without user_id filter, show current user's items
        let filterValue = authenticatedUserId;
        if (userIdField === 'actor_id') {
          const actor = await getOrCreateUserActor(authenticatedUserId);
          filterValue = actor.id;
        }
        query = query.eq(userIdField, filterValue);
      } else {
        // Public list: filter by public statuses only
        query = query.in('status', publicStatuses);

        // Apply public filters (e.g., is_public = true for AI assistants)
        for (const [field, value] of Object.entries(publicFilters)) {
          query = query.eq(field, value as string | number | boolean);
        }
      }

      // Apply standard filters
      if (category) {
        query = query.eq('category', category);
      }

      // Apply ordering (use nullsLast to handle NULL values gracefully)
      query = query.order(orderBy, { ascending: orderDirection === 'asc', nullsFirst: false });

      // Apply additional filters from config
      for (const [field, paramName] of Object.entries(additionalFilters)) {
        const value = getString(request.url, paramName);
        if (value) {
          query = query.eq(field, value);
        }
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: items, error, count } = await query;

      if (error) {
        logger.error(`Error fetching ${entityType}`, {
          error,
          table,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId,
          includeOwnDrafts,
        });
        // Return empty array instead of error to prevent 500 (similar to loans API)
        return apiSuccess([], {
          page: calculatePage(offset, limit),
          limit,
          total: 0,
          headers: {
            'Cache-Control': getCacheControl(!!userId),
          },
        });
      }

      return apiSuccess(items || [], {
        page: calculatePage(offset, limit),
        limit,
        total: count || 0,
        headers: {
          'Cache-Control': getCacheControl(!!userId),
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
