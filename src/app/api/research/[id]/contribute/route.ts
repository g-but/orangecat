/**
 * Research Contribution API
 *
 * GET  /api/research/[id]/contribute - Get contribution history
 * POST /api/research/[id]/contribute - Make a contribution
 */

import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  apiBadRequest,
  handleApiError,
} from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { DATABASE_TABLES } from '@/config/database-tables';
import {
  createResearchContribution,
  computeContributionStats,
} from '@/domain/research/contributionService';
import { z } from 'zod';

const contributeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().max(10).optional(),
  funding_model: z.enum(['donation', 'subscription', 'milestone', 'royalty']),
  message: z.string().max(1000).optional(),
  anonymous: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ResearchContributionRow {
  id: string;
  amount_btc: number;
  funding_model: string;
  [key: string]: unknown;
}

export const GET = withOptionalAuth(async (request, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'research ID'));
  if (idValidation) {
    return idValidation;
  }
  try {
    const { user, supabase } = request;

    const { data: entity, error: entityError } = await supabase
      .from(DATABASE_TABLES.RESEARCH_ENTITIES)
      .select('id, is_public, user_id')
      .eq('id', id)
      .single();

    if (entityError) {
      if (entityError.code === 'PGRST116') {
        return apiNotFound('Research entity not found');
      }
      throw entityError;
    }

    let canSeeDetails = user?.id === entity?.user_id;
    if (!canSeeDetails && user) {
      const { data: myContribs } = await supabase
        .from(DATABASE_TABLES.RESEARCH_CONTRIBUTIONS)
        .select('id')
        .eq('research_entity_id', id)
        .eq('user_id', user.id)
        .limit(1);
      canSeeDetails = !!myContribs?.length;
    }

    let query = supabase
      .from(DATABASE_TABLES.RESEARCH_CONTRIBUTIONS)
      .select(canSeeDetails ? '*' : 'id, amount_btc, funding_model, anonymous, status, created_at')
      .eq('research_entity_id', id)
      .order('created_at', { ascending: false });

    if (!canSeeDetails) {
      query = query.eq('anonymous', false);
    }

    const { data: contributionsData, error } = await query;
    if (error) {
      throw error;
    }

    const contributions = (contributionsData ?? []) as unknown as ResearchContributionRow[];
    return apiSuccess({ contributions, statistics: computeContributionStats(contributions) });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withOptionalAuth(async (request, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'research ID'));
  if (idValidation) {
    return idValidation;
  }
  try {
    const { user, supabase } = request;

    const rawBody = await (request as NextRequest).json();
    const parsed = contributeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiBadRequest(parsed.error.errors[0]?.message || 'Invalid contribution data');
    }
    const result = await createResearchContribution(supabase, id, user?.id ?? null, parsed.data);

    if (!result.ok) {
      switch (result.code) {
        case 'NOT_FOUND':
          return apiNotFound(result.message);
        case 'NOT_ACCEPTING':
          return apiUnauthorized(result.message);
        case 'INVALID_AMOUNT':
          return apiUnauthorized(result.message);
        case 'INVALID_MODEL':
          return apiUnauthorized(result.message);
        case 'DB_ERROR':
          return handleApiError(new Error(result.message));
      }
    }

    return apiSuccess(
      {
        contribution: result.contribution,
        lightning_invoice: result.invoice,
        message:
          'Contribution recorded. Please pay the Lightning invoice to complete the transaction.',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
});
