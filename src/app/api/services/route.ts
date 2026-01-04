import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { userServiceSchema } from '@/domain/services/schema';
import { handleApiError, apiSuccess } from '@/lib/api/standardResponse';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { createService, listEntitiesPage } from '@/domain/commerce/service';
import { withRequestId } from '@/lib/api/withRequestId';
import { getPagination, getString } from '@/lib/api/query';
import { getCacheControl, calculatePage } from '@/lib/api/helpers';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';
import { getTableName } from '@/config/entity-registry';

// GET /api/services - Get all active services
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

    const { items, total } = await listEntitiesPage(getTableName('service'), {
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

// POST /api/services - Create new service
export const POST = createEntityPostHandler({
  entityType: 'service',
  schema: userServiceSchema,
  createEntity: async (userId, data) => {
    return await createService(userId, data as { title: string; category: string; [key: string]: unknown });
  },
});
