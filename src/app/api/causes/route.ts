/**
 * Cause API Routes
 *
 * Uses compose() middleware pattern for consistent, DRY code.
 * See docs/development/ENGINEERING_PRINCIPLES.md for patterns.
 *
 * Refactored: 2025-12-25 from 130 lines to ~60 lines (54% reduction)
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { userCauseSchema } from '@/domain/causes/schema';
import { handleApiError, apiSuccess } from '@/lib/api/standardResponse';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { createCause, listEntitiesPage } from '@/domain/commerce/service';
import { withRequestId } from '@/lib/api/withRequestId';
import { getPagination, getString } from '@/lib/api/query';
import { getCacheControl, calculatePage } from '@/lib/api/helpers';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';
import { getTableName } from '@/config/entity-registry';

// GET /api/causes - Get all active causes
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (request: NextRequest) => {
  try {
    const supabase = await createServerClient();
    const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });
    const category = getString(request.url, 'category');
    const userId = getString(request.url, 'user_id');

    // Show drafts if requesting own user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const includeOwnDrafts = Boolean(userId && user && userId === user.id);

    const { items, total } = await listEntitiesPage(getTableName('cause'), {
      limit,
      offset,
      category,
      userId,
      includeOwnDrafts,
    });

    // Use private cache for user-specific queries, public for general listings
    const cacheControl = getCacheControl(Boolean(userId));

    return apiSuccess(items, {
      page: calculatePage(offset, limit),
      limit,
      total,
      headers: {
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/causes - Create new cause
export const POST = createEntityPostHandler({
  entityType: 'cause',
  schema: userCauseSchema,
  createEntity: async (userId, data) => {
    return await createCause(userId, data as { title: string; cause_category: string; [key: string]: unknown });
  },
});
