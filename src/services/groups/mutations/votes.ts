import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { TABLES } from '../constants';
import { getCurrentUserId, isGroupMember } from '../utils/helpers';
import { getProposal, getProposalVotes } from '../queries/proposals';
import { executeProposalAction } from '../execution';

export interface CastVoteInput {
  proposal_id: string;
  vote: 'yes' | 'no' | 'abstain';
}

export async function castVote(input: CastVoteInput) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {return { success: false, error: 'Authentication required' };}

    const proposalResult = await getProposal(input.proposal_id);
    if (!proposalResult.success || !proposalResult.proposal) {
      return { success: false, error: 'Proposal not found' };
    }
    const proposal = proposalResult.proposal;

    const isMember = await isGroupMember(proposal.group_id, userId);
    if (!isMember) {return { success: false, error: 'Only group members can vote' };}

    if (proposal.status !== 'active') {
      return { success: false, error: `Cannot vote on proposal with status: ${proposal.status}` };
    }

    const now = new Date();
    if (proposal.voting_starts_at && new Date(proposal.voting_starts_at) > now) {
      return { success: false, error: 'Voting has not started' };
    }
    if (proposal.voting_ends_at && new Date(proposal.voting_ends_at) < now) {
      return { success: false, error: 'Voting has ended' };
    }

    const { data, error } = await (supabase
      .from(TABLES.group_votes) as any)
      .upsert(
        {
          proposal_id: input.proposal_id,
          voter_id: userId,
          vote: input.vote,
          voting_power: 1.0,
          voted_at: new Date().toISOString(),
        },
        { onConflict: 'proposal_id,voter_id' }
      )
      .select()
      .single();

    if (error) {
      logger.error('Failed to cast vote', error, 'Groups');
      return { success: false, error: error.message };
    }

    await checkAndResolveProposal(input.proposal_id);

    return { success: true, vote: data };
  } catch (error) {
    logger.error('Exception casting vote', error, 'Groups');
    return { success: false, error: 'Failed to cast vote' };
  }
}

export async function checkAndResolveProposal(proposalId: string): Promise<void> {
  try {
    const proposalResult = await getProposal(proposalId);
    if (!proposalResult.success || !proposalResult.proposal) {return;}
    const proposal = proposalResult.proposal;

    if (proposal.status !== 'active') {return;}

    const votesResult = await getProposalVotes(proposalId);
    if (!votesResult.success || !votesResult.votes) {return;}
    const votes = votesResult.votes;

    const yesVotes = votes
      .filter((v: any) => v.vote === 'yes')
      .reduce((sum: number, v: any) => sum + Number(v.voting_power || 1), 0);
    const noVotes = votes
      .filter((v: any) => v.vote === 'no')
      .reduce((sum: number, v: any) => sum + Number(v.voting_power || 1), 0);
    const totalVotedPower = yesVotes + noVotes;

    const yesPercentage = totalVotedPower > 0 ? (yesVotes / totalVotedPower) * 100 : 0;

    const threshold = proposal.voting_threshold || 50;
    const now = new Date();
    const votingEnded = proposal.voting_ends_at ? new Date(proposal.voting_ends_at) < now : false;

    if (votingEnded || yesPercentage >= threshold) {
      const newStatus: 'passed' | 'failed' = yesPercentage >= threshold ? 'passed' : 'failed';

      // Single update; accept idempotency (if already updated, harmless)
      await (supabase
        .from(TABLES.group_proposals) as any)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', proposalId);

      if (newStatus === 'passed' && proposal.action_type) {
        await executeProposalAction(proposalId, proposal);
      }
    }
  } catch (error) {
    logger.error('Exception checking proposal resolution', error, 'Groups');
  }
}

