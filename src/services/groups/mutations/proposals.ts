import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { TABLES } from '../constants';
import { canPerformAction } from '../permissions/resolver';
import { getCurrentUserId, isGroupMember } from '../utils/helpers';
import { getProposal } from '../queries/proposals';

export interface CreateProposalInput {
  group_id: string;
  title: string;
  description?: string;
  proposal_type?: string;
  action_type?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action_data?: Record<string, any>;
  voting_threshold?: number;
  voting_starts_at?: string;
  voting_ends_at?: string;
  is_public?: boolean;
}

export async function createProposal(input: CreateProposalInput) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const permResult = await canPerformAction(userId, input.group_id, 'create_proposal');
    if (!permResult.allowed) {
      return { success: false, error: permResult.reason || 'Insufficient permissions' };
    }

    if (!input.title || input.title.trim().length === 0) {
      return { success: false, error: 'Title is required' };
    }
    if (input.title.length > 200) {
      return { success: false, error: 'Title must be 200 characters or less' };
    }
    if (input.description && input.description.length > 5000) {
      return { success: false, error: 'Description must be 5000 characters or less' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(TABLES.group_proposals) as any)
      .insert({
        group_id: input.group_id,
        proposer_id: userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        proposal_type: input.proposal_type || 'general',
        action_type: input.action_type || null,
        action_data: input.action_data || {},
        voting_threshold: input.voting_threshold || null,
        voting_starts_at: input.voting_starts_at || null,
        voting_ends_at: input.voting_ends_at || null,
        status: 'draft',
        is_public: input.is_public ?? false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create proposal', error, 'Groups');
      return { success: false, error: error.message };
    }

    return { success: true, proposal: data };
  } catch (error) {
    logger.error('Exception creating proposal', error, 'Groups');
    return { success: false, error: 'Failed to create proposal' };
  }
}

export async function activateProposal(proposalId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const proposalResult = await getProposal(proposalId);
    if (!proposalResult.success || !proposalResult.proposal) {
      return { success: false, error: 'Proposal not found' };
    }
    const proposal = proposalResult.proposal;

    if (proposal.status !== 'draft') {
      return { success: false, error: `Cannot activate proposal with status: ${proposal.status}` };
    }

    const isMember = await isGroupMember(proposal.group_id, userId);
    const isProposer = proposal.proposer_id === userId;
    if (!isMember && !isProposer) {
      return { success: false, error: 'Only proposer or member can activate proposal' };
    }

    // Determine threshold and dates
    const now = new Date();
    const votingStartsAt = proposal.voting_starts_at ? new Date(proposal.voting_starts_at) : now;
    const votingEndsAt = proposal.voting_ends_at
      ? new Date(proposal.voting_ends_at)
      : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const threshold = proposal.voting_threshold || 50;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(TABLES.group_proposals) as any)
      .update({
        status: 'active',
        voting_starts_at: votingStartsAt.toISOString(),
        voting_ends_at: votingEndsAt.toISOString(),
        voting_threshold: threshold,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to activate proposal', error, 'Groups');
      return { success: false, error: error.message };
    }

    return { success: true, proposal: data };
  } catch (error) {
    logger.error('Exception activating proposal', error, 'Groups');
    return { success: false, error: 'Failed to activate proposal' };
  }
}

export async function updateProposal(
  proposalId: string,
  updates: Partial<{
    title: string;
    description: string;
    proposal_type: string;
    action_type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action_data: Record<string, any>;
    voting_threshold: number;
    voting_starts_at: string;
    voting_ends_at: string;
    is_public: boolean;
  }>
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const proposalResult = await getProposal(proposalId);
    if (!proposalResult.success || !proposalResult.proposal) {
      return { success: false, error: 'Proposal not found' };
    }
    const proposal = proposalResult.proposal;

    if (proposal.status !== 'draft') {
      return { success: false, error: 'Only draft proposals can be updated' };
    }

    if (proposal.proposer_id !== userId) {
      return { success: false, error: 'Only the proposer can update the proposal' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    const fields = [
      'title',
      'description',
      'proposal_type',
      'action_type',
      'action_data',
      'voting_threshold',
      'voting_starts_at',
      'voting_ends_at',
      'is_public',
    ] as const;

    for (const key of fields) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((updates as any)[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload as any)[key] = (updates as any)[key];
      }
    }

    if (payload.title && payload.title.trim().length === 0) {
      return { success: false, error: 'Title is required' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(TABLES.group_proposals) as any)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update proposal', error, 'Groups');
      return { success: false, error: error.message };
    }

    return { success: true, proposal: data };
  } catch (error) {
    logger.error('Exception updating proposal', error, 'Groups');
    return { success: false, error: 'Failed to update proposal' };
  }
}

export async function deleteProposal(proposalId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const proposalResult = await getProposal(proposalId);
    if (!proposalResult.success || !proposalResult.proposal) {
      return { success: false, error: 'Proposal not found' };
    }
    const proposal = proposalResult.proposal;

    if (proposal.status !== 'draft') {
      return { success: false, error: 'Only draft proposals can be deleted' };
    }

    if (proposal.proposer_id !== userId) {
      return { success: false, error: 'Only the proposer can delete the proposal' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(TABLES.group_proposals) as any)
      .delete()
      .eq('id', proposalId);
    if (error) {
      logger.error('Failed to delete proposal', error, 'Groups');
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Exception deleting proposal', error, 'Groups');
    return { success: false, error: 'Failed to delete proposal' };
  }
}
