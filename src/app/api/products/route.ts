import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { userProductSchema } from '@/domain/products/schema';
import { handleApiError, apiSuccess } from '@/lib/api/standardResponse';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { createProduct, listEntitiesPage } from '@/domain/commerce/service';
import { withRequestId } from '@/lib/api/withRequestId';
import { getPagination, getString } from '@/lib/api/query';
import { getCacheControl, calculatePage } from '@/lib/api/helpers';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';
import { getTableName } from '@/config/entity-registry';
import { logger } from '@/utils/logger';

// GET /api/products - Get all active products
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
      error: authError,
    } = await supabase.auth.getUser();
    const includeOwnDrafts = Boolean(userId && user && userId === user.id);

    // Debug logging
    logger.info('Products GET request', {
      userId,
      authUserId: user?.id,
      authError: authError?.message,
      includeOwnDrafts,
      userIdMatch: userId === user?.id,
    });

    const { items, total } = await listEntitiesPage(getTableName('product'), {
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

// POST /api/products - Create new product
export const POST = createEntityPostHandler({
  entityType: 'product',
  schema: userProductSchema,
  createEntity: async (userId, data, supabase) => {
    return await createProduct(userId, data as { title: string; price_sats: number; [key: string]: unknown }, supabase);
  },
});
