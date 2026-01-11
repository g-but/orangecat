import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { researchEntityConfig } from '@/config/entity-configs/research-entity-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { compose } from '@/lib/api/compose';
import { withZodBody } from '@/lib/api/withZod';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { getPagination, getString } from '@/lib/api/query';
import { rateLimitWrite } from '@/lib/rate-limit';
import { getCacheControl, calculatePage } from '@/lib/api/helpers';
import { getTableName } from '@/config/entity-registry';
import { ResearchEntityCreate } from '@/types/research';

// GET /api/research-entities - List research entities
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

    // Check auth for showing private entities (user info available if needed)
    await supabase.auth.getUser();

    // Build query
    const tableName = getTableName('research_entity');
    let itemsQuery = supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    let countQuery = supabase.from(tableName).select('*', { count: 'exact', head: true });

    // Apply filters
    if (userId) {
      itemsQuery = itemsQuery.eq('user_id', userId);
      countQuery = countQuery.eq('user_id', userId);
    } else {
      // Public listing: only public entities
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
      // Filter by SDG alignment or impact areas
      itemsQuery = itemsQuery.contains('sdg_alignment', [{ goal: category }]);
      countQuery = countQuery.contains('sdg_alignment', [{ goal: category }]);
    }

    const [{ data: items, error: itemsError }, { count, error: countError }] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    if (itemsError) {
      throw itemsError;
    }
    if (countError) {
      throw countError;
    }

    // Cache control based on query type
    const cacheControl = getCacheControl(Boolean(userId));

    return apiSuccess(items || [], {
      page: calculatePage(offset, limit),
      limit,
      total: count || 0,
      headers: { 'Cache-Control': cacheControl },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/research-entities - Create new research entity
export const POST = compose(
  withRequestId(),
  ...(researchEntityConfig.schema
    ? [withZodBody(researchEntityConfig.schema as Parameters<typeof withZodBody>[0])]
    : []),
  withRateLimit('write')
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

    // Rate limit check
    const rl = rateLimitWrite(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      logger.warn('Research entity creation rate limit exceeded', { userId: user.id });
      return apiRateLimited('Too many creation requests. Please slow down.', retryAfter);
    }

    // Check user limit (max 10 research entities per user)
    const tableName = getTableName('research_entity');
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      throw countError;
    }

    if (count && count >= 10) {
      return apiRateLimited(
        'Maximum 10 research entities per user. Please complete or archive existing projects.',
        3600
      );
    }

    const validatedData = ctx.body as ResearchEntityCreate;

    // Generate unique wallet address for this research entity
    // In production, this would integrate with a wallet service
    const walletAddress = `bc1q${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    // Create the research entity
    const { data: researchEntity, error } = await supabase
      .from(tableName)
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        field: validatedData.field,
        methodology: validatedData.methodology,
        expected_outcome: validatedData.expected_outcome,
        timeline: validatedData.timeline,
        funding_goal: validatedData.funding_goal,
        funding_goal_currency: validatedData.funding_goal_currency,
        funding_raised_btc: 0,
        funding_model: validatedData.funding_model,
        wallet_address: walletAddress,
        lead_researcher: validatedData.lead_researcher,
        team_members: validatedData.team_members || [],
        open_collaboration: validatedData.open_collaboration ?? true,
        resource_needs: validatedData.resource_needs || [],
        progress_frequency: validatedData.progress_frequency,
        transparency_level: validatedData.transparency_level,
        voting_enabled: validatedData.voting_enabled ?? true,
        impact_areas: validatedData.impact_areas || [],
        target_audience: validatedData.target_audience || [],
        sdg_alignment: validatedData.sdg_alignment || [],
        status: 'draft',
        is_public: validatedData.is_public ?? true,
        is_featured: false,
        completion_percentage: 0,
        days_active: 0,
        funding_velocity: 0,
        follower_count: 0,
        share_count: 0,
        citation_count: 0,
        total_votes: 0,
        total_contributors: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Research entity creation failed', { userId: user.id, error: error.message });
      throw error;
    }

    logger.info('Research entity created successfully', {
      researchEntityId: researchEntity.id,
      userId: user.id,
      walletAddress: walletAddress,
    });

    return apiSuccess(researchEntity, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
