import { logger } from '@/utils/logger';
import supabase from '@/lib/supabase/browser';
import { TABLES } from '../constants';

type ProposalRecord = any;

type ActionHandler = (proposalId: string, proposal: ProposalRecord) => Promise<void>;

const handlers: Record<string, ActionHandler> = {
  async associate_entity(_proposalId, proposal) {
    // Extract entity details
    const { entity_type, entity_id } = proposal.action_data || {};
    if (!entity_type || !entity_id) {return;}
    try {
      // Idempotent: just set group ownership if not already
      const groupId = proposal.group_id;
      const { getTableName } = await import('@/config/entity-registry');
      const tableName = getTableName(entity_type);

      // Fetch group's actor id
      const { getActorByGroup } = await import('@/services/actors');
      const groupActor = await getActorByGroup(groupId);
      if (!groupActor) {return;}

      await supabase.from(tableName).update({ actor_id: groupActor.id, group_id: groupId }).eq('id', entity_id);
    } catch (error) {
      logger.error('Error executing associate_entity', error, 'Groups');
    }
  },
  async create_contract(_proposalId, proposal) {
    try {
      const { createContract } = await import('@/services/contracts/mutations/contracts');
      const { party_a_actor_id, party_b_actor_id, contract_type, terms } = proposal.action_data || {};
      if (!party_a_actor_id || !party_b_actor_id || !contract_type) {
        logger.warn('Missing required fields for create_contract', { proposalId: _proposalId }, 'Groups');
        return;
      }
      
      // Get group's actor_id for party_a if not provided
      let partyAActorId = party_a_actor_id;
      if (!partyAActorId) {
        const { getActorByGroup } = await import('@/services/actors');
        const groupActor = await getActorByGroup(proposal.group_id);
        if (!groupActor) {
          logger.error('Group actor not found', { groupId: proposal.group_id }, 'Groups');
          return;
        }
        partyAActorId = groupActor.id;
      }

      const result = await createContract({
        party_a_actor_id: partyAActorId,
        party_b_actor_id,
        contract_type,
        terms: terms || {},
        proposal_id: proposal.id,
      });

      if (!result.success) {
        logger.error('Failed to create contract from proposal', { error: result.error }, 'Groups');
        throw new Error(result.error || 'Failed to create contract');
      }

      logger.info('Contract created from proposal', { proposalId: _proposalId, contractId: result.contract?.id }, 'Groups');
    } catch (error) {
      logger.error('Error executing create_contract', error, 'Groups');
      throw error;
    }
  },
  async create_project(_proposalId, proposal) {
    try {
      const { createProject } = await import('@/domain/projects/service');
      const { getActorByGroup } = await import('@/services/actors');
      
      // Get group's actor_id
      const groupActor = await getActorByGroup(proposal.group_id);
      if (!groupActor) {
        logger.error('Group actor not found', { groupId: proposal.group_id }, 'Groups');
        return;
      }

      // Extract project data from action_data
      const projectData = proposal.action_data || {};
      
      // Create project owned by group
      const project = await createProject(proposal.proposer_id, {
        ...projectData,
        group_id: proposal.group_id,
        actor_id: groupActor.id,
      });

      // Update proposal with created project ID
      await supabase
        .from(TABLES.group_proposals)
        .update({
          action_data: {
            ...proposal.action_data,
            project_id: project.id,
          },
        })
        .eq('id', _proposalId);

      logger.info('Project created from proposal', { proposalId: _proposalId, projectId: project.id }, 'Groups');
    } catch (error) {
      logger.error('Error executing create_project', error, 'Groups');
      throw error;
    }
  },
  async spend_funds(_proposalId, proposal) {
    try {
      const { amount_sats, recipient_address, wallet_id, note } = proposal.action_data || {};
      
      if (!amount_sats || !recipient_address) {
        logger.warn('Missing required fields for spend_funds', { proposalId: _proposalId }, 'Groups');
        return;
      }

      // For now, just mark the proposal as ready for manual execution
      // In a full implementation, this would:
      // 1. Check wallet balance
      // 2. Create transaction record
      // 3. Notify authorized signers
      // 4. Wait for multisig execution
      
      await supabase
        .from(TABLES.group_proposals)
        .update({
          action_data: {
            ...proposal.action_data,
            execution_status: 'pending_manual_execution',
            execution_note: 'Awaiting manual multisig execution',
          },
        })
        .eq('id', _proposalId);

      logger.info('Spending proposal marked for manual execution', {
        proposalId: _proposalId,
        amount_sats,
        recipient_address,
      }, 'Groups');
    } catch (error) {
      logger.error('Error executing spend_funds', error, 'Groups');
      throw error;
    }
  },
};

export async function executeProposalAction(proposalId: string, proposal: ProposalRecord): Promise<void> {
  try {
    const action = proposal.action_type as string;
    const handler = handlers[action];
    if (!handler) {
      logger.warn('Unknown proposal action', { action }, 'Groups');
      return;
    }

    // Mark as executed before/after to avoid duplicate runs
    const { data: reloaded } = await supabase
      .from(TABLES.group_proposals)
      .select('executed_at, execution_result')
      .eq('id', proposalId)
      .single();

    if (reloaded?.executed_at) {
      return; // already executed
    }

    await handler(proposalId, proposal);

    await supabase
      .from(TABLES.group_proposals)
      .update({ executed_at: new Date().toISOString(), execution_result: { ok: true, action: proposal.action_type } })
      .eq('id', proposalId);
  } catch (error) {
    logger.error('Exception executing proposal action', error, 'Groups');
    await supabase
      .from(TABLES.group_proposals)
      .update({ executed_at: new Date().toISOString(), execution_result: { ok: false, error: String(error) } })
      .eq('id', proposalId);
  }
}
