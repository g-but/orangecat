/**
 * Research API - List and Create
 *
 * GET  /api/research - List research topics
 * POST /api/research - Create a new research entity
 */

import { createServerClient } from '@/lib/supabase/server';
import { researchConfig } from '@/config/entity-configs/research-config';
import {
  apiSuccess,
  apiUnauthorized,
  handleApiError,
} from '@/lib/api/standardResponse';
import { compose } from '@/lib/api/compose';
import { withZodBody } from '@/lib/api/withZod';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { getPagination, getString } from '@/lib/api/query';
import { applyRateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit';
import { enforceUserWriteLimit, handleRateLimitError } from '@/lib/api/rateLimiting';
import { getCacheControl, calculatePage } from '@/lib/api/helpers';
import { getTableName } from '@/config/entity-registry';
import type { ResearchEntityCreate } from '@/types/research';
import { NextRequest } from 'next/server';
import { createResearch } from '@/domain/research/createResearch';

// GET /api/research - List research topics
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (request: NextRequest) => {
  try {
    const supabase = await createServerClient();
    const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });
    const category = getString(request.url, 'category');
    const userId = getString(request.url, 'user_id');
    const field = getString(request.url, 'field');
    const status = getString(request.url, 'status');

    const tableName = getTableName('research');
    let itemsQuery = supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    let countQuery = supabase.from(tableName).select('*', { count: 'exact', head: true });

    if (userId) {
      itemsQuery = itemsQuery.eq('user_id', userId);
      countQuery = countQuery.eq('user_id', userId);
    } else {
      itemsQuery = itemsQuery.eq('is_public', true);
      countQuery = countQuery.eq('is_public', true);
    }

    if (field) {
      itemsQuery = itemsQuery.eq('field', field);
      countQuery = countQuery.eq('field', field);
    }
    if (status) {
      itemsQuery = itemsQuery.eq('status', status);
      countQuery = countQuery.eq('status', status);
    }
    if (category) {
      itemsQuery = itemsQuery.contains('sdg_alignment', [{ goal: category }]);
      countQuery = countQuery.contains('sdg_alignment', [{ goal: category }]);
    }

    const [{ data: items, error: itemsError }, { count, error: countError }] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    if (itemsError) throw itemsError;
    if (countError) throw countError;

    return apiSuccess(items || [], {
      page: calculatePage(offset, limit),
      limit,
      total: count || 0,
      headers: { 'Cache-Control': getCacheControl(Boolean(userId)) },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/research - Create new research entity
export const POST = compose(
  withRequestId(),
  ...(researchConfig.schema
    ? [withZodBody(researchConfig.schema as Parameters<typeof withZodBody>[0])]
    : []),
  withRateLimit('write')
)(async (request: NextRequest, ctx) => {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return apiUnauthorized();

    let rl: RateLimitResult;
    try {
      rl = await enforceUserWriteLimit(user.id);
    } catch (e) {
      const limited = handleRateLimitError(e, 'Too many creation requests. Please slow down.');
      if (limited) return limited;
      throw e;
    }

    const { response } = await createResearch(supabase, user.id, ctx.body as ResearchEntityCreate);
    return applyRateLimitHeaders(response, rl);
  } catch (error) {
    return handleApiError(error);
  }
});
