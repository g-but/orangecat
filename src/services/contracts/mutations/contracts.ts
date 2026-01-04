import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { CONTRACT_TYPES } from '@/config/contract-types';
import { getCurrentUserId } from '@/services/groups/utils/helpers';
import { getActor } from '@/services/actors';
import { getContract } from '../queries/contracts';

export interface CreateContractInput {
  party_a_actor_id: string;
  party_b_actor_id: string;
  contract_type: keyof typeof CONTRACT_TYPES;
  terms: Record<string, any>;
  proposal_id?: string;
}

export async function createContract(input: CreateContractInput) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: 'Authentication required' };

    const partyA = await getActor(input.party_a_actor_id);
    const partyB = await getActor(input.party_b_actor_id);
    if (!partyA || !partyB) return { success: false, error: 'Invalid party actor' };

    if (partyB.actor_type === 'group') {
      const { createProposal } = await import('@/services/groups/mutations/proposals');
      const proposalResult = await createProposal({
        group_id: partyB.group_id!,
        title: `Create ${CONTRACT_TYPES[input.contract_type].name} Contract`,
        description: `Proposal to create contract with ${partyA.display_name || partyA.id}`,
        proposal_type: 'membership',
        action_type: 'create_contract',
        action_data: {
          party_a_actor_id: input.party_a_actor_id,
          party_b_actor_id: input.party_b_actor_id,
          contract_type: input.contract_type,
          terms: input.terms,
        },
        is_public: false,
      });

      if (!proposalResult.success) {
        return { success: false, error: proposalResult.error || 'Failed to create proposal' };
      }

      return { success: true, contract: null, proposalId: proposalResult.proposal?.id, method: 'proposal' };
    } else {
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          party_a_actor_id: input.party_a_actor_id,
          party_b_actor_id: input.party_b_actor_id,
          contract_type: input.contract_type,
          terms: input.terms,
          status: 'proposed',
          created_by: userId,
          proposal_id: input.proposal_id || null,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create contract', error, 'Contracts');
        return { success: false, error: error.message };
      }

      return { success: true, contract: data, method: 'direct' };
    }
  } catch (error) {
    logger.error('Exception creating contract', error, 'Contracts');
    return { success: false, error: 'Failed to create contract' };
  }
}

export async function activateContract(contractId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: 'Authentication required' };

    const contract = await getContract(contractId);
    if (!contract.success || !contract.contract) {
      return { success: false, error: 'Contract not found' };
    }

    if (contract.contract.status !== 'proposed') {
      return { success: false, error: `Cannot activate contract with status: ${contract.contract.status}` };
    }

    const { data, error } = await supabase
      .from('contracts')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to activate contract', error, 'Contracts');
      return { success: false, error: error.message };
    }

    return { success: true, contract: data };
  } catch (error) {
    logger.error('Exception activating contract', error, 'Contracts');
    return { success: false, error: 'Failed to activate contract' };
  }
}

