/**
 * Research Vote API
 *
 * GET  /api/research/[id]/vote - Get voting results
 * POST /api/research/[id]/vote - Cast a vote
 */

import { NextRequest } from 'next/server';
import { withAuth, withOptionalAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  apiBadRequest,
  handleApiError,
} from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { DATABASE_TABLES } from '@/config/database-tables';
import { aggregateVotes, castVote } from '@/domain/research/voteService';
import { z } from 'zod';

const castVoteSchema = z.object({
  vote_type: z.enum(['direction', 'priority', 'impact', 'continuation']),
  choice: z.string().min(1, 'Choice is required').max(200),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withOptionalAuth(async (request, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'research ID'));
  if (idValidation) {return idValidation;}
  try {
    const { user, supabase } = request;

    const { data: entity, error: entityError } = await supabase.from(DATABASE_TABLES.RESEARCH_ENTITIES)
      .select('id, is_public, voting_enabled')
      .eq('id', id)
      .single();

    if (entityError) {
      if (entityError.code === 'PGRST116') {return apiNotFound('Research entity not found');}
      throw entityError;
    }
    if (!entity?.voting_enabled) {return apiUnauthorized('Voting is not enabled for this research entity');}

    if (!entity.is_public && !user) {return apiUnauthorized('This research entity is private');}

    const { data: votesData, error } = await supabase
      .from(DATABASE_TABLES.RESEARCH_VOTES)
      .select('*')
      .eq('research_entity_id', id);
    if (error) {throw error;}

    return apiSuccess(aggregateVotes(votesData ?? [], user?.id ?? null));
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'research ID'));
  if (idValidation) {return idValidation;}
  const { user, supabase } = request;
  try {
    const { data: entity, error: entityError } = await supabase.from(DATABASE_TABLES.RESEARCH_ENTITIES)
      .select('id, is_public, voting_enabled, contributions')
      .eq('id', id)
      .single();

    if (entityError) {
      if (entityError.code === 'PGRST116') {return apiNotFound('Research entity not found');}
      throw entityError;
    }
    if (!entity?.voting_enabled) {return apiUnauthorized('Voting is not enabled for this research entity');}
    if (!entity.is_public) {return apiUnauthorized('Cannot vote on private research entities');}

    const rawBody = await (request as NextRequest).json();
    const parsed = castVoteSchema.safeParse(rawBody);
    if (!parsed.success) {return apiBadRequest(parsed.error.errors[0]?.message || 'Invalid vote data');}
    const { vote_type, choice } = parsed.data;

    const contributorIds = (entity.contributions ?? []).map((c: any) => c.user_id as string);
    const result = await castVote(supabase, id, user.id, vote_type, choice, contributorIds);

    if (!result.ok) {
      if (result.code === 'INVALID_TYPE') {return apiBadRequest(result.message);}
      return handleApiError(new Error(result.message));
    }

    return apiSuccess(result.vote);
  } catch (error) {
    return handleApiError(error);
  }
});
