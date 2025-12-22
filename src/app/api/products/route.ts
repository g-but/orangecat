import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { userProductSchema } from '@/domain/products/schema';
import {
  apiSuccess,
  apiUnauthorized,
  apiInternalError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { compose } from '@/lib/api/compose';
import { withZodBody } from '@/lib/api/withZod';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { createProduct, listEntitiesPage } from '@/domain/commerce/service';
import { withRequestId } from '@/lib/api/withRequestId';
import { getPagination, getString } from '@/lib/api/query';
import { rateLimitWrite } from '@/lib/rate-limit';
import { apiRateLimited } from '@/lib/api/standardResponse';

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
    } = await supabase.auth.getUser();
    const includeOwnDrafts = Boolean(userId && user && userId === user.id);

    const { items, total } = await listEntitiesPage('user_products', {
      limit,
      offset,
      category,
      userId,
      includeOwnDrafts,
    });

    // Use private cache for user-specific queries, public for general listings
    const cacheControl = userId
      ? 'private, no-cache, no-store, must-revalidate'
      : 'public, s-maxage=60, stale-while-revalidate=300';

    return apiSuccess(items, {
      page: Math.floor(offset / limit) + 1,
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
export const POST = compose(
  withRequestId(),
  withZodBody(userProductSchema)
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

    // Write rate limit per user
    const rl = rateLimitWrite(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      logger.warn('Product creation rate limit exceeded', { userId: user.id });
      return apiRateLimited('Too many product creation requests. Please slow down.', retryAfter);
    }

    const product = await createProduct(user.id, ctx.body, supabase);
    logger.info('Product created successfully', { productId: product.id });
    return apiSuccess(product, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
