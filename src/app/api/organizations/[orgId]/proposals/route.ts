import { withOptionalAuth } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiForbidden,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';

interface Vote {
  vote: 'yes' | 'no' | 'abstain';
  voting_power: number | string;
  voter_id: string;
}

export const GET = withOptionalAuth(async (
  req,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: organizationId } = await params;
    const { user } = req;
    const supabase = await createServerClient();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status') || 'active';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

    // Check if user can view this group's proposals
    const { data: member } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', organizationId)
      .eq('user_id', user?.id || '')
      .maybeSingle();

    const { data: group } = await supabase
      .from('groups')
      .select('is_public')
      .eq('id', organizationId)
      .single();

    if (!group?.is_public && !member) {
      return apiForbidden('Access denied');
    }

    // Get proposals with vote counts
    const { data: proposals, error } = await supabase
      .from('group_proposals')
      .select(`
        *,
        profiles!group_proposals_proposer_id_fkey (
          display_name,
          avatar_url
        ),
        group_votes (
          vote,
          voting_power
        )
      `)
      .eq('group_id', organizationId)
      .eq('status', status)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Proposals fetch error', { error, organizationId }, 'Organizations');
      return handleApiError(error);
    }

    // Calculate voting results for each proposal
    const proposalsWithResults = proposals?.map(proposal => {
      const votes: Vote[] = proposal.group_votes || [];
      const totalVotes = votes.length;
      const yesVotes = votes.filter((v: Vote) => v.vote === 'yes').reduce((sum: number, v: Vote) => sum + Number(v.voting_power), 0);
      const noVotes = votes.filter((v: Vote) => v.vote === 'no').reduce((sum: number, v: Vote) => sum + Number(v.voting_power), 0);
      const abstainVotes = votes.filter((v: Vote) => v.vote === 'abstain').reduce((sum: number, v: Vote) => sum + Number(v.voting_power), 0);
      const totalVotingPower = yesVotes + noVotes + abstainVotes;

      const yesPercentage = totalVotingPower > 0 ? (yesVotes / totalVotingPower) * 100 : 0;
      const hasPassed = yesPercentage >= (proposal.voting_threshold || 50);

      return {
        ...proposal,
        voting_results: {
          total_votes: totalVotes,
          yes_votes: yesVotes,
          no_votes: noVotes,
          abstain_votes: abstainVotes,
          total_voting_power: totalVotingPower,
          yes_percentage: Math.round(yesPercentage * 100) / 100,
          has_passed: hasPassed,
        },
        user_vote: user ? votes.find((v: Vote) => v.voter_id === user.id) : null,
      };
    });

    return apiSuccess({
      proposals: proposalsWithResults || [],
      hasMore: proposalsWithResults && proposalsWithResults.length === limit,
    });
  } catch (error) {
    logger.error('Proposals GET error', { error, organizationId: (await params).id }, 'Organizations');
    return handleApiError(error);
  }
});

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { z } from 'zod';
import {
  apiCreated,
  apiValidationError,
} from '@/lib/api/standardResponse';

const createProposalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  proposal_type: z.string().optional().default('general'),
  voting_type: z.string().optional().default('simple'),
  voting_threshold: z.number().min(0).max(100).optional().default(50),
  execution_delay: z.string().optional().default('24 hours'),
  data: z.record(z.any()).optional().default({}),
});

export const POST = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: organizationId } = await params;
    const { user } = req;
    const supabase = await createServerClient();

    // Check if user is a member
    const { data: member } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!member) {
      return apiForbidden('Only group members can create proposals');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = createProposalSchema.safeParse(body);

    if (!validation.success) {
      return apiValidationError('Invalid request data', {
        fields: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const {
      title,
      description,
      proposal_type,
      voting_type,
      voting_threshold,
      execution_delay,
      data,
    } = validation.data;

    // Get group's governance preset to set default voting type
    const { data: group } = await supabase
      .from('groups')
      .select('governance_preset')
      .eq('id', organizationId)
      .single();

    // Note: group_proposals table doesn't have voting_type or execution_delay fields
    // Create proposal
    const proposalData = {
      group_id: organizationId,
      proposer_id: user.id,
      title,
      description,
      proposal_type,
      voting_threshold: voting_threshold ? Math.round(voting_threshold) : null,
      action_data: data || {},
    };

    const { data: proposal, error: insertError } = await supabase
      .from('group_proposals')
      .insert(proposalData)
      .select(`
        *,
        profiles!group_proposals_proposer_id_fkey (
          display_name,
          avatar_url
        )
      `)
      .single();

    if (insertError) {
      logger.error('Proposal creation error', { error: insertError, organizationId, userId: user.id }, 'Organizations');
      return handleApiError(insertError);
    }

    return apiCreated(proposal, { status: 201 });
  } catch (error) {
    logger.error('Proposal POST error', { error, organizationId: (await params).id, userId: req.user.id }, 'Organizations');
    return handleApiError(error);
  }
});
