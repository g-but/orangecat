/**
 * Research Vote API
 *
 * GET  /api/research/[id]/vote - Get voting results
 * POST /api/research/[id]/vote - Cast a vote
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  apiBadRequest,
  handleApiError,
} from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { aggregateVotes, castVote } from '@/domain/research/voteService';
import { z } from 'zod';

const castVoteSchema = z.object({
  vote_type: z.enum(['direction', 'priority', 'impact', 'continuation']),
  choice: z.string().min(1, 'Choice is required').max(200),
});

function extractIdFromUrl(url: string): string {
  const segments = new URL(url).pathname.split('/');
  const idx = segments.findIndex(s => s === 'research');
  return segments[idx + 1] || '';
}

export const GET = compose(withRateLimit('read'))(async (request: NextRequest) => {
  const id = extractIdFromUrl(request.url);
  const idValidation = getValidationError(validateUUID(id, 'research ID'));
  if (idValidation) {return idValidation;}
  try {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entity, error: entityError } = await (supabase.from(DATABASE_TABLES.RESEARCH_ENTITIES) as any)
      .select('id, is_public, voting_enabled')
      .eq('id', id)
      .single();

    if (entityError) {
      if (entityError.code === 'PGRST116') {return apiNotFound('Research entity not found');}
      throw entityError;
    }
    if (!entity?.voting_enabled) {return apiUnauthorized('Voting is not enabled for this research entity');}

    const { data: { user } } = await supabase.auth.getUser();
    if (!entity.is_public && !user) {return apiUnauthorized('This research entity is private');}

    const { data: votesData, error } = await supabase
      .from(DATABASE_TABLES.RESEARCH_VOTES)
      .select('*')
      .eq('research_entity_id', id);
    if (error) {throw error;}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiSuccess(aggregateVotes((votesData ?? []) as any[], user?.id ?? null));
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = compose(withRateLimit('write'))(async (request: NextRequest) => {
  const id = extractIdFromUrl(request.url);
  const idValidation = getValidationError(validateUUID(id, 'research ID'));
  if (idValidation) {return idValidation;}
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {return apiUnauthorized();}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entity, error: entityError } = await (supabase.from(DATABASE_TABLES.RESEARCH_ENTITIES) as any)
      .select('id, is_public, voting_enabled, contributions')
      .eq('id', id)
      .single();

    if (entityError) {
      if (entityError.code === 'PGRST116') {return apiNotFound('Research entity not found');}
      throw entityError;
    }
    if (!entity?.voting_enabled) {return apiUnauthorized('Voting is not enabled for this research entity');}
    if (!entity.is_public) {return apiUnauthorized('Cannot vote on private research entities');}

    const rawBody = await request.json();
    const parsed = castVoteSchema.safeParse(rawBody);
    if (!parsed.success) {return apiBadRequest(parsed.error.errors[0]?.message || 'Invalid vote data');}
    const { vote_type, choice } = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
