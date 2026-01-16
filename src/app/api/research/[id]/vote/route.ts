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

interface ResearchEntity {
  id: string;
  is_public: boolean;
  voting_enabled: boolean;
  contributions?: { user_id: string }[];
}

interface Vote {
  id: string;
  research_entity_id: string;
  user_id: string;
  vote_type: string;
  choice: string;
  weight: number;
}

// Helper to extract ID from URL
function extractIdFromUrl(url: string): string {
  const segments = new URL(url).pathname.split('/');
  const idx = segments.findIndex(s => s === 'research');
  return segments[idx + 1] || '';
}

// GET /api/research/[id]/vote - Get voting results
export const GET = compose(withRateLimit('read'))(async (request: NextRequest) => {
  const id = extractIdFromUrl(request.url);
  try {
    const supabase = await createServerClient();

    // Check if research entity exists and allows voting
    const { data: entityData, error: entityError } = await supabase
      .from('research_entities')
      .select('id, is_public, voting_enabled')
      .eq('id', id)
      .single();
    const entity = entityData as ResearchEntity | null;

    if (entityError) {
      if (entityError.code === 'PGRST116') {
        return apiNotFound('Research entity not found');
      }
      throw entityError;
    }

    if (!entity || !entity.voting_enabled) {
      return apiUnauthorized('Voting is not enabled for this research entity');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check access permissions
    if (!entity.is_public && !user) {
      return apiUnauthorized('This research entity is private');
    }

    // Get all votes for this entity
    const { data: votesData, error } = await supabase
      .from('research_votes')
      .select('*')
      .eq('research_entity_id', id);
    const votes = (votesData ?? []) as Vote[];

    if (error) {
      throw error;
    }

    // Aggregate voting results
    const voteSummary: {
      total_votes: number;
      by_type: Record<string, Record<string, number>>;
      user_vote: Record<string, string> | null;
    } = {
      total_votes: votes.length,
      by_type: {},
      user_vote: null,
    };

    // Group votes by type and choice
    votes.forEach(vote => {
      if (!voteSummary.by_type[vote.vote_type]) {
        voteSummary.by_type[vote.vote_type] = {};
      }
      voteSummary.by_type[vote.vote_type][vote.choice] =
        (voteSummary.by_type[vote.vote_type][vote.choice] || 0) + vote.weight;

      // Check if this is the current user's vote
      if (user && vote.user_id === user.id) {
        if (!voteSummary.user_vote) {
          voteSummary.user_vote = {};
        }
        voteSummary.user_vote[vote.vote_type] = vote.choice;
      }
    });

    return apiSuccess(voteSummary);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/research/[id]/vote - Cast a vote
export const POST = compose(withRateLimit('write'))(async (request: NextRequest) => {
  const id = extractIdFromUrl(request.url);
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Check if research entity exists and allows voting
    const { data: entityData2, error: entityError } = await supabase
      .from('research_entities')
      .select('id, is_public, voting_enabled, contributions')
      .eq('id', id)
      .single();
    const entity = entityData2 as ResearchEntity | null;

    if (entityError) {
      if (entityError.code === 'PGRST116') {
        return apiNotFound('Research entity not found');
      }
      throw entityError;
    }

    if (!entity || !entity.voting_enabled) {
      return apiUnauthorized('Voting is not enabled for this research entity');
    }

    if (!entity.is_public) {
      return apiUnauthorized('Cannot vote on private research entities');
    }

    const { vote_type, choice } = await request.json();

    if (!vote_type || !choice) {
      return apiUnauthorized('Vote type and choice are required');
    }

    // Validate vote type
    const validTypes = ['direction', 'priority', 'impact', 'continuation'];
    if (!validTypes.includes(vote_type)) {
      return apiUnauthorized('Invalid vote type');
    }

    // Calculate voting weight based on contribution level
    let weight = 1.0; // Base weight for all users

    // Increase weight for contributors (simplified - could be more sophisticated)
    const contributions = entity.contributions;
    if (contributions && contributions.length > 0) {
      const userContributions = contributions.filter((c) => c.user_id === user.id);
      if (userContributions.length > 0) {
        weight = 2.0; // Double weight for contributors
      }
    }

    // Insert or update vote (UPSERT)
    const { data: voteData, error } = await (supabase
      .from('research_votes') as ReturnType<typeof supabase.from>)
      .upsert(
        {
          research_entity_id: id,
          user_id: user.id,
          vote_type,
          choice,
          weight,
        },
        {
          onConflict: 'research_entity_id,user_id,vote_type',
        }
      )
      .select()
      .single();
    const vote = voteData as Vote | null;

    if (error) {
      throw error;
    }

    logger.info('Vote cast successfully', {
      researchEntityId: id,
      userId: user.id,
      voteType: vote_type,
      choice,
      weight,
    });

    return apiSuccess(vote);
  } catch (error) {
    return handleApiError(error);
  }
});
