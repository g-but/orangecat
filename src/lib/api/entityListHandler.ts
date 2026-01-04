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
 * Last Modified: 2025-01-28
 * Last Modified Summary: Initial creation of generic entity list handler
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiInternalError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { getPagination, getString } from '@/lib/api/query';
import { logger } from '@/utils/logger';
import { type EntityType, getEntityMetadata } from '@/config/entity-registry';
import { listEntitiesPage } from '@/domain/commerce/service';
import { getCacheControl, calculatePage } from './helpers';
import { getAuthenticatedUserId, shouldIncludeDrafts } from './authHelpers';

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
    draftStatuses = ['draft', 'active'],
    orderBy = 'created_at',
    orderDirection = 'desc',
    additionalFilters = {},
    useListHelper = false,
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
      const includeOwnDrafts = await shouldIncludeDrafts(userId ?? null, authenticatedUserId);

      // Use listEntitiesPage helper for commerce entities
      const commerceTables = ['user_products', 'user_services', 'user_causes'] as const;
      if (useListHelper && commerceTables.includes(table as typeof commerceTables[number])) {
        const { items, total } = await listEntitiesPage(table as typeof commerceTables[number], {
          limit,
          offset,
          category,
          userId,
          includeOwnDrafts,
        });

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
      const statuses = includeOwnDrafts ? draftStatuses : publicStatuses;
      let query = supabase
        .from(table)
        .select('*', { count: 'exact' })
        .in('status', statuses)
        .order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply standard filters
      if (category) query = query.eq('category', category);
      if (userId) query = query.eq('user_id', userId);

      // Apply additional filters from config
      for (const [field, paramName] of Object.entries(additionalFilters)) {
        const value = getString(request.url, paramName);
        if (value) query = query.eq(field, value);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: items, error, count } = await query;

      if (error) {
        logger.error(`Error fetching ${entityType}`, { error, table });
        return apiInternalError(`Failed to fetch ${meta.namePlural.toLowerCase()}`);
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

