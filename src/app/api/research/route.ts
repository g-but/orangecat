import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { researchConfig } from '@/config/entity-configs/research-config';
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
import { applyRateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit';
import { enforceUserWriteLimit, RateLimitError } from '@/lib/api/rateLimiting';
import { getCacheControl, calculatePage } from '@/lib/api/helpers';
import { getTableName } from '@/config/entity-registry';
import { ResearchEntityCreate } from '@/types/research';

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

    // Check auth for showing private entities (user info available if needed)
    await supabase.auth.getUser();

    // Build query
    const tableName = getTableName('research');
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

// POST /api/research - Create new research topic
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
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Rate limit check
    let rl: RateLimitResult;
    try {
      rl = await enforceUserWriteLimit(user.id);
    } catch (e) {
      if (e instanceof RateLimitError) {
        const retryAfter = e.details?.retryAfter || 60;
        logger.warn('Research entity creation rate limit exceeded', { userId: user.id });
        return apiRateLimited('Too many creation requests. Please slow down.', retryAfter);
      }
      throw e;
    }

    // Check user limit (max 10 research entities per user)
    const tableName = getTableName('research');
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

    // Get funding_goal_sats from validated data
    const fundingGoalSats = (validatedData as { funding_goal_sats?: number }).funding_goal_sats || 1000;

    // Build insert data
    const insertData = {
      user_id: user.id,
      title: validatedData.title,
      description: validatedData.description,
      field: validatedData.field,
      methodology: validatedData.methodology,
      expected_outcome: validatedData.expected_outcome,
      timeline: validatedData.timeline,
      funding_goal_sats: fundingGoalSats,
      funding_raised_sats: 0,
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
    };

    logger.info('Attempting to create research entity', {
      tableName,
      userId: user.id,
      insertData: JSON.stringify(insertData),
    });

    // First check if the user exists in profiles table (required for foreign key)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    logger.info('Profile check result', {
      hasProfile: !!profileData,
      profileError: profileError ? JSON.stringify(profileError) : null,
    });

    if (profileError || !profileData) {
      logger.error('User profile not found - cannot create research entity', {
        userId: user.id,
        profileError: profileError?.message,
      });
      throw new Error('User profile not found. Please complete your profile setup first.');
    }

    // Create the research entity with throwOnError for better error messages
    try {
      // Try with explicit error handling using status
      const response = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName) as any)
        .insert(insertData)
        .select()
        .single();

      const { data: researchEntity, error, status, statusText } = response;

      logger.info('Supabase insert result', {
        hasData: !!researchEntity,
        hasError: !!error,
        status,
        statusText,
        dataKeys: researchEntity ? Object.keys(researchEntity) : [],
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        errorKeys: error ? Object.keys(error) : [],
        errorProto: error ? Object.getPrototypeOf(error)?.constructor?.name : null,
      });

      // Check for error or failed status
      if (error || status >= 400) {
        logger.error('Research entity creation failed', {
          userId: user.id,
          status,
          statusText,
          error: error?.message,
          errorCode: error?.code,
          errorDetails: error?.details,
          errorHint: error?.hint,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error || {})),
        });
        throw new Error(error?.message || `Database error (status ${status}): ${statusText || 'Unknown error'}`);
      }

      logger.info('Research entity created successfully', {
        researchEntityId: researchEntity.id,
        userId: user.id,
        walletAddress: walletAddress,
      });

      return applyRateLimitHeaders(apiSuccess(researchEntity, { status: 201 }), rl);
    } catch (insertError) {
      logger.error('Supabase insert threw exception', {
        message: (insertError as Error).message,
        name: (insertError as Error).name,
        stack: (insertError as Error).stack,
      });
      throw insertError;
    }
  } catch (error) {
    return handleApiError(error);
  }
});
