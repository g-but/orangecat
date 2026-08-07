/**
 * Governance action handlers — "the Cat proposes; Solon disposes."
 *
 * propose_governance_change files a change to the platform's allocation
 * policy (the Cat's own spending leash) as a Solon proposal. Filing is ALL
 * this does: the Cat signs the proposal with its own key (CAT_SOLON_PRIVKEY),
 * a draft version is recorded locally, and the change only ever activates if
 * the Solon vote approves it and decision-verify re-verifies every signature.
 * The action is high-risk + always-confirmed, so a human okays the filing
 * itself before anything leaves this system.
 */
import { DATABASE_TABLES } from '@/config/database-tables';
import {
  ALLOCATION_POLICY_KEY,
  SOLON_BASE_URL_DEFAULT,
  SOLON_ORG_SLUG,
  type AllocationPolicyContent,
} from '@/config/solon';
import { contentHashOf } from '@/services/solon/canonical';
import {
  addressFromPrivateKey,
  signBitcoinMessage,
  solonProposalMessage,
} from '@/services/solon/bitcoin-message';
import { logger } from '@/utils/logger';
import type { ActionHandler } from './types';

export const governanceHandlers: Record<string, ActionHandler> = {
  propose_governance_change: async (supabase, _userId, _actorId, params) => {
    const privateKey = process.env.CAT_SOLON_PRIVKEY;
    const apiKey = process.env.SOLON_AGENT_API_KEY;
    if (!privateKey || !apiKey) {
      return { success: false, error: 'Solon governance is not configured on this deployment' };
    }

    const title = (params.title as string | undefined)?.trim();
    const rationale = (params.rationale as string | undefined)?.trim();
    const daily = Number(params.max_cat_daily_spend_btc);
    const perAction = Number(params.max_cat_btc_per_action);
    if (!title || !rationale) {
      return { success: false, error: 'title and rationale are required' };
    }
    if (!Number.isFinite(daily) || daily <= 0 || !Number.isFinite(perAction) || perAction <= 0) {
      return { success: false, error: 'both ceilings must be positive BTC amounts' };
    }
    if (perAction > daily) {
      return { success: false, error: 'per-action ceiling cannot exceed the daily ceiling' };
    }

    const content: AllocationPolicyContent = {
      max_cat_daily_spend_btc: daily,
      max_cat_btc_per_action: perAction,
    };
    const contentHash = contentHashOf(content);

    // Local draft first — decision-verify later attaches the approved decision
    // to this row by content hash. Version is provisional (next after latest).
    const { data: latest } = await supabase
      .from(DATABASE_TABLES.ALLOCATION_POLICIES)
      .select('version')
      .eq('policy_key', ALLOCATION_POLICY_KEY)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: draft, error: draftError } = await supabase
      .from(DATABASE_TABLES.ALLOCATION_POLICIES)
      .insert({
        policy_key: ALLOCATION_POLICY_KEY,
        version: (latest?.version ?? 0) + 1,
        content: content as never,
        content_hash: contentHash,
        status: 'draft',
      })
      .select('id')
      .single();
    if (draftError || !draft) {
      return { success: false, error: `failed to record draft: ${draftError?.message}` };
    }

    // The Cat's attestation: its own key, its own address, content hash bound.
    const proposerAddress = addressFromPrivateKey(privateKey);
    const signature = signBitcoinMessage(
      solonProposalMessage({
        orgSlug: SOLON_ORG_SLUG,
        category: 'ALLOCATION_POLICY',
        title,
        proposerAddress,
        contentHash,
      }),
      privateKey
    );

    const base = process.env.SOLON_BASE_URL || SOLON_BASE_URL_DEFAULT;
    let solonResult: { created?: boolean; proposalId?: string; reason?: string };
    try {
      const res = await fetch(`${base}/api/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          orgSlug: SOLON_ORG_SLUG,
          category: 'ALLOCATION_POLICY',
          title,
          body: rationale,
          policyKey: ALLOCATION_POLICY_KEY,
          proposedContent: content,
          target: `orangecat:${ALLOCATION_POLICY_KEY}`,
          proposerAddress,
          signature,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      solonResult = await res.json();
    } catch (e) {
      solonResult = { reason: e instanceof Error ? e.message : 'Solon unreachable' };
    }

    if (!solonResult.created || !solonResult.proposalId) {
      // Filing failed — mark the local draft rejected so it cannot linger as
      // a half-open proposal, and surface Solon's reason.
      await supabase
        .from(DATABASE_TABLES.ALLOCATION_POLICIES)
        .update({ status: 'rejected' })
        .eq('id', draft.id);
      return {
        success: false,
        error: `Solon refused the proposal: ${solonResult.reason ?? 'unknown'}`,
      };
    }

    await supabase
      .from(DATABASE_TABLES.ALLOCATION_POLICIES)
      .update({ solon_proposal_id: solonResult.proposalId })
      .eq('id', draft.id);

    logger.info(
      'Cat filed a governance proposal on Solon',
      { proposalId: solonResult.proposalId, contentHash },
      'Solon'
    );
    return {
      success: true,
      data: {
        message:
          `Proposal filed on Solon (${solonResult.proposalId}). Nothing changes unless the vote approves it: ` +
          `the session must be opened, members vote with Bitcoin signatures, and OrangeCat re-verifies the ` +
          `decision before the new ceilings activate. Track it at ${base}/governance/audit.`,
        solonProposalId: solonResult.proposalId,
        contentHash,
        proposedContent: content,
      },
    };
  },
};
