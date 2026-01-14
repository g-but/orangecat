import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { convertToBtc } from '@/services/currency';

// Helper to extract ID from URL
function extractIdFromUrl(url: string): string {
  const segments = new URL(url).pathname.split('/');
  const idx = segments.findIndex(s => s === 'research-entities');
  return segments[idx + 1] || '';
}

// GET /api/research-entities/[id]/contribute - Get contribution history
export const GET = compose(
  withRateLimit('read')
)(async (request: NextRequest) => {
  const id = extractIdFromUrl(request.url);
  try {
    const supabase = await createServerClient();

    // Check if research entity exists
    const { data: entityData, error: entityError } = await (supabase
      .from('research_entities') as any)
      .select('id, is_public, user_id')
      .eq('id', id)
      .single();
    const entity = entityData as any;

    if (entityError) {
      if (entityError.code === 'PGRST116') {
        return apiNotFound('Research entity not found');
      }
      throw entityError;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Only owners and contributors can see full contribution details
    const canSeeDetails =
      user &&
      (user.id === entity.user_id ||
        (await (supabase
          .from('research_contributions') as any)
          .select('id')
          .eq('research_entity_id', id)
          .eq('user_id', user.id)
          .limit(1)
          .then(({ data }: any) => data && data.length > 0)));

    let query = (supabase
      .from('research_contributions') as any)
      .select(canSeeDetails ? '*' : 'id, amount_btc, funding_model, anonymous, status, created_at')
      .eq('research_entity_id', id)
      .order('created_at', { ascending: false });

    // Hide anonymous contributor details unless owner
    if (!canSeeDetails) {
      query = query.eq('anonymous', false);
    }

    const { data: contributionsData, error } = await query;
    const contributions = contributionsData as any[];

    if (error) {
      throw error;
    }

    // Calculate contribution statistics
    const stats = {
      total_contributors: contributions?.length || 0,
      total_amount_btc: contributions?.reduce((sum, c) => sum + c.amount_btc, 0) || 0,
      average_contribution: contributions?.length
        ? contributions.reduce((sum, c) => sum + c.amount_btc, 0) / contributions.length
        : 0,
      funding_sources: {} as Record<string, number>,
    };

    // Count funding sources
    contributions?.forEach(contribution => {
      stats.funding_sources[contribution.funding_model] =
        (stats.funding_sources[contribution.funding_model] || 0) + contribution.amount_btc;
    });

    return apiSuccess({
      contributions: contributions || [],
      statistics: stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/research-entities/[id]/contribute - Make a contribution
export const POST = compose(
  withRateLimit('write')
)(async (request: NextRequest) => {
  const id = extractIdFromUrl(request.url);
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if research entity exists and accepts contributions
    const { data: entityData2, error: entityError } = await (supabase
      .from('research_entities') as any)
      .select('id, is_public, funding_goal, funding_goal_currency, funding_raised_btc, status')
      .eq('id', id)
      .single();
    const entity = entityData2 as any;

    if (entityError) {
      if (entityError.code === 'PGRST116') {
        return apiNotFound('Research entity not found');
      }
      throw entityError;
    }

    if (!entity.is_public) {
      return apiUnauthorized('Cannot contribute to private research entities');
    }

    if (entity.status === 'completed' || entity.status === 'cancelled') {
      return apiUnauthorized('This research entity is no longer accepting contributions');
    }

    const { amount, currency, funding_model, message, anonymous } = await request.json();

    if (!amount || amount <= 0) {
      return apiUnauthorized('Valid contribution amount is required');
    }

    // Convert amount to BTC for storage
    const amountBtc = convertToBtc(amount, currency || 'SATS');

    if (amountBtc < 0.00001) {
      // Minimum ~500 sats at current rates
      return apiUnauthorized('Minimum contribution is 0.00001 BTC');
    }

    const validModels = ['donation', 'subscription', 'milestone', 'royalty'];
    if (!validModels.includes(funding_model)) {
      return apiUnauthorized('Invalid funding model');
    }

    // Generate Lightning invoice (simplified - would integrate with real wallet)
    const satsAmount = Math.round(amountBtc * 100_000_000);
    const invoice = `lnbc${satsAmount}...`; // Placeholder

    // Create contribution record
    const contributionData = {
      research_entity_id: id,
      user_id: anonymous ? null : user?.id || null,
      amount_btc: amountBtc,
      funding_model,
      message,
      anonymous: anonymous || false,
      lightning_invoice: invoice,
      status: 'pending',
    };

    const { data: contribution, error } = await (supabase
      .from('research_contributions') as any)
      .insert(contributionData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update research entity funding total
    await (supabase.rpc as any)('update_research_funding', {
      research_entity_id: id,
      amount_btc: amountBtc,
    });

    logger.info('Research contribution created', {
      researchEntityId: id,
      contributionId: contribution.id,
      amountBtc,
      anonymous,
      userId: user?.id,
    });

    return apiSuccess(
      {
        contribution,
        lightning_invoice: invoice,
        message:
          'Contribution recorded. Please pay the Lightning invoice to complete the transaction.',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
});
