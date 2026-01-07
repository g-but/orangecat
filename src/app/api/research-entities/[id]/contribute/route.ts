import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { withRateLimit } from '@/lib/api/withRateLimit';

// GET /api/research-entities/[id]/contribute - Get contribution history
export const GET = withRateLimit('read')(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createServerClient();

    // Check if research entity exists
    const { data: entity, error: entityError } = await supabase
      .from('research_entities')
      .select('id, is_public, user_id')
      .eq('id', params.id)
      .single();

    if (entityError) {
      if (entityError.code === 'PGRST116') {
        return apiNotFound('Research entity not found');
      }
      throw entityError;
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Only owners and contributors can see full contribution details
    const canSeeDetails = user && (user.id === entity.user_id ||
      await supabase.from('research_contributions')
        .select('id')
        .eq('research_entity_id', params.id)
        .eq('user_id', user.id)
        .limit(1)
        .then(({ data }) => data && data.length > 0)
    );

    let query = supabase
      .from('research_contributions')
      .select(canSeeDetails ?
        '*' :
        'id, amount_sats, funding_model, anonymous, status, created_at'
      )
      .eq('research_entity_id', params.id)
      .order('created_at', { ascending: false });

    // Hide anonymous contributor details unless owner
    if (!canSeeDetails) {
      query = query.eq('anonymous', false);
    }

    const { data: contributions, error } = await query;

    if (error) {throw error;}

    // Calculate contribution statistics
    const stats = {
      total_contributors: contributions?.length || 0,
      total_amount_sats: contributions?.reduce((sum, c) => sum + c.amount_sats, 0) || 0,
      average_contribution: contributions?.length ?
        Math.round((contributions.reduce((sum, c) => sum + c.amount_sats, 0) / contributions.length)) : 0,
      funding_sources: {} as Record<string, number>,
    };

    // Count funding sources
    contributions?.forEach(contribution => {
      stats.funding_sources[contribution.funding_model] =
        (stats.funding_sources[contribution.funding_model] || 0) + contribution.amount_sats;
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
export const POST = withRateLimit('write')(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if research entity exists and accepts contributions
    const { data: entity, error: entityError } = await supabase
      .from('research_entities')
      .select('id, is_public, funding_goal_sats, funding_raised_sats, status')
      .eq('id', params.id)
      .single();

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

    const { amount_sats, funding_model, message, anonymous } = await request.json();

    if (!amount_sats || amount_sats <= 0) {
      return apiUnauthorized('Valid contribution amount is required');
    }

    if (amount_sats < 1000) { // Minimum 1000 sats
      return apiUnauthorized('Minimum contribution is 1000 sats');
    }

    const validModels = ['donation', 'subscription', 'milestone', 'royalty'];
    if (!validModels.includes(funding_model)) {
      return apiUnauthorized('Invalid funding model');
    }

    // Generate Lightning invoice (simplified - would integrate with real wallet)
    const invoice = `lnbc${amount_sats}...`; // Placeholder

    // Create contribution record
    const contributionData = {
      research_entity_id: params.id,
      user_id: anonymous ? null : user?.id || null,
      amount_sats,
      funding_model,
      message,
      anonymous: anonymous || false,
      lightning_invoice: invoice,
      status: 'pending',
    };

    const { data: contribution, error } = await supabase
      .from('research_contributions')
      .insert(contributionData)
      .select()
      .single();

    if (error) {throw error;}

    // Update research entity funding total
    await supabase.rpc('update_research_funding', {
      research_entity_id: params.id,
      amount_sats,
    });

    logger.info('Research contribution created', {
      researchEntityId: params.id,
      contributionId: contribution.id,
      amountSats: amount_sats,
      anonymous,
      userId: user?.id
    });

    return apiSuccess({
      contribution,
      lightning_invoice: invoice,
      message: 'Contribution recorded. Please pay the Lightning invoice to complete the transaction.'
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});