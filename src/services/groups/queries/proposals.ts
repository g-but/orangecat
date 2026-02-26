import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { TABLES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

export type ProposalStatus = 'draft' | 'active' | 'passed' | 'failed' | 'executed' | 'cancelled';

export interface Proposal {
  id: string;
  group_id: string;
  proposer_id: string;
  title: string;
  description?: string | null;
  proposal_type: 'general' | 'treasury' | 'membership' | 'governance' | 'employment';
  status: ProposalStatus;
  action_type?: string | null;
  action_data?: Record<string, unknown> | null;
  voting_threshold?: number | null;
  voting_starts_at?: string | null;
  voting_ends_at?: string | null;
  voting_results?: {
    yes_votes: number;
    no_votes: number;
    abstain_votes: number;
    total_voting_power: number;
  } | null;
  is_public?: boolean;
  amount_sats?: number | null;
  recipient_address?: string | null;
  created_at: string;
  updated_at: string;
  proposer?: {
    name?: string | null;
    avatar_url?: string | null;
  } | null;
  groupSlug?: string; // Added by components
}

export interface ProposalsListResponse {
  success: boolean;
  proposals?: Proposal[];
  total?: number;
  error?: string;
}

export interface ProposalResponse {
  success: boolean;
  proposal?: Proposal;
  error?: string;
}

export interface VoteData {
  vote: string;
  voting_power: number | string;
}

export async function getProposal(
  proposalId: string,
  client?: AnySupabaseClient
): Promise<ProposalResponse> {
  try {
    const sb = client || supabase;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb.from(TABLES.group_proposals) as any)
      .select(
        `
        *,
        proposer:profiles!group_proposals_proposer_id_fkey (
          name,
          avatar_url
        ),
        group_votes (
          vote,
          voting_power,
          voter_id
        )
      `
      )
      .eq('id', proposalId)
      .single();

    if (error) {
      logger.error('Failed to get proposal', error, 'Groups');
      return { success: false, error: error.message };
    }

    const votes = ((data as { group_votes?: VoteData[] })?.group_votes || []) as VoteData[];
    const yesVotes = votes
      .filter(v => v.vote === 'yes')
      .reduce((sum: number, v) => sum + Number(v.voting_power || 1), 0);
    const noVotes = votes
      .filter(v => v.vote === 'no')
      .reduce((sum: number, v) => sum + Number(v.voting_power || 1), 0);
    const totalVotingPower = yesVotes + noVotes;

    const yesPercentage = totalVotingPower > 0 ? (yesVotes / totalVotingPower) * 100 : 0;

    return {
      success: true,
      proposal: {
        ...data,
        voting_results: {
          yes_votes: yesVotes,
          no_votes: noVotes,
          total_voting_power: totalVotingPower,
          yes_percentage: Math.round(yesPercentage * 100) / 100,
          has_passed:
            yesPercentage >=
            (Number((data as { voting_threshold?: number })?.voting_threshold) || 50),
        },
      },
    };
  } catch (error) {
    logger.error('Exception getting proposal', error, 'Groups');
    return { success: false, error: 'Failed to get proposal' };
  }
}

export interface ProposalVote {
  id: string;
  proposal_id: string;
  voter_id: string;
  vote: 'yes' | 'no' | 'abstain';
  voting_power: number;
  created_at: string;
}

export async function getProposalVotes(
  proposalId: string,
  client?: AnySupabaseClient
): Promise<{ success: boolean; votes?: ProposalVote[]; error?: string }> {
  try {
    const sb = client || supabase;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb.from(TABLES.group_votes) as any)
      .select('*')
      .eq('proposal_id', proposalId);

    if (error) {
      logger.error('Failed to get proposal votes', error, 'Groups');
      return { success: false, error: error.message };
    }

    return { success: true, votes: data || [] };
  } catch (error) {
    logger.error('Exception getting proposal votes', error, 'Groups');
    return { success: false, error: 'Failed to get votes' };
  }
}

export async function getGroupProposals(
  groupId: string,
  options?: {
    status?: ProposalStatus | 'all';
    proposal_type?: string;
    limit?: number;
    offset?: number;
  },
  client?: AnySupabaseClient
): Promise<ProposalsListResponse> {
  try {
    const sb = client || supabase;
    const limit = Math.min(options?.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = options?.offset || 0;
    const status = options?.status || 'all';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (sb.from(TABLES.group_proposals) as any)
      .select(
        `
        *,
        proposer:profiles!group_proposals_proposer_id_fkey (
          name,
          avatar_url
        ),
        group_votes (
          vote,
          voting_power,
          voter_id
        )
      `,
        { count: 'exact' }
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (options?.proposal_type) {
      query = query.eq('proposal_type', options.proposal_type);
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error('Failed to get proposals', error, 'Groups');
      return { success: false, error: error.message };
    }

    interface ProposalWithVotes extends Proposal {
      group_votes?: VoteData[];
    }
    const proposalsWithResults = (data || []).map((proposal: ProposalWithVotes) => {
      const votes = proposal.group_votes || [];
      const yesVotes = votes
        .filter(v => v.vote === 'yes')
        .reduce((sum: number, v) => sum + Number(v.voting_power || 1), 0);
      const noVotes = votes
        .filter(v => v.vote === 'no')
        .reduce((sum: number, v) => sum + Number(v.voting_power || 1), 0);
      const totalVotingPower = yesVotes + noVotes;
      const yesPercentage = totalVotingPower > 0 ? (yesVotes / totalVotingPower) * 100 : 0;

      return {
        ...proposal,
        voting_results: {
          yes_votes: yesVotes,
          no_votes: noVotes,
          total_voting_power: totalVotingPower,
          yes_percentage: Math.round(yesPercentage * 100) / 100,
          has_passed: yesPercentage >= (proposal.voting_threshold || 50),
        },
      };
    });

    return {
      success: true,
      proposals: proposalsWithResults,
      total: count || 0,
    };
  } catch (error) {
    logger.error('Exception getting proposals', error, 'Groups');
    return { success: false, error: 'Failed to get proposals' };
  }
}

/**
 * Get public job postings (for browse/marketplace)
 * Follows Network State Development Guide - Job Postings feature
 */
export async function getPublicJobPostings(
  options?: {
    limit?: number;
    offset?: number;
    location?: string;
    job_type?: string;
  },
  client?: AnySupabaseClient
): Promise<ProposalsListResponse> {
  try {
    const sb = client || supabase;
    const limit = Math.min(options?.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = options?.offset || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = (sb.from(TABLES.group_proposals) as any)
      .select(
        `
        *,
        proposer:profiles!group_proposals_proposer_id_fkey (
          name,
          avatar_url
        ),
        groups!inner (
          id,
          name,
          slug,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('proposal_type', 'employment')
      .eq('is_public', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Failed to get job postings', error, 'Groups');
      return { success: false, error: error.message };
    }
    return {
      success: true,
      proposals: data || [],
      total: count || 0,
    };
  } catch (error) {
    logger.error('Exception getting job postings', error, 'Groups');
    return { success: false, error: 'Failed to get job postings' };
  }
}
