/**
 * Research Contribution API
 *
 * GET  /api/research/[id]/contribute - Get contribution history
 * POST /api/research/[id]/contribute - Make a contribution
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
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { createResearchContribution, computeContributionStats } from '@/domain/research/contributionService';

function extractIdFromUrl(url: string): string {
  const segments = new URL(url).pathname.split('/');
  const idx = segments.findIndex(s => s === 'research');
  return segments[idx + 1] || '';
}

export const GET = compose(withRateLimit('read'))(async (request: NextRequest) => {
  const id = extractIdFromUrl(request.url);
  try {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entity, error: entityError } = await (supabase.from(DATABASE_TABLES.RESEARCH_ENTITIES) as any)
      .select('id, is_public, user_id')
      .eq('id', id)
      .single();

    if (entityError) {
      if (entityError.code === 'PGRST116') return apiNotFound('Research entity not found');
      throw entityError;
    }

    const { data: { user } } = await supabase.auth.getUser();

    let canSeeDetails = user?.id === entity?.user_id;
    if (!canSeeDetails && user) {
      const { data: myContribs } = await supabase
        .from(DATABASE_TABLES.RESEARCH_CONTRIBUTIONS)
        .select('id').eq('research_entity_id', id).eq('user_id', user.id).limit(1);
      canSeeDetails = !!(myContribs?.length);
    }

    let query = supabase
      .from(DATABASE_TABLES.RESEARCH_CONTRIBUTIONS)
      .select(canSeeDetails ? '*' : 'id, amount_btc, funding_model, anonymous, status, created_at')
      .eq('research_entity_id', id)
      .order('created_at', { ascending: false });

    if (!canSeeDetails) query = query.eq('anonymous', false);

    const { data: contributionsData, error } = await query;
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contributions = (contributionsData ?? []) as any[];
    return apiSuccess({ contributions, statistics: computeContributionStats(contributions) });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = compose(withRateLimit('write'))(async (request: NextRequest) => {
  const id = extractIdFromUrl(request.url);
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const result = await createResearchContribution(supabase, id, user?.id ?? null, body);

    if (!result.ok) {
      switch (result.code) {
        case 'NOT_FOUND': return apiNotFound(result.message);
        case 'NOT_ACCEPTING': return apiUnauthorized(result.message);
        case 'INVALID_AMOUNT': return apiUnauthorized(result.message);
        case 'INVALID_MODEL': return apiUnauthorized(result.message);
        case 'DB_ERROR': return handleApiError(new Error(result.message));
      }
    }

    return apiSuccess(
      { contribution: result.contribution, lightning_invoice: result.invoice, message: 'Contribution recorded. Please pay the Lightning invoice to complete the transaction.' },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
});
