/**
 * Research Contribution Service
 *
 * Business logic for creating research contributions.
 */

import { DATABASE_TABLES } from '@/config/database-tables';
import { PROJECT_STATUS } from '@/config/project-statuses';
import { convertToBtc } from '@/services/currency';
import { logger } from '@/utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const MIN_AMOUNT_BTC = 0.00001;
const VALID_FUNDING_MODELS = ['donation', 'subscription', 'milestone', 'royalty'];

export type CreateContributionResult =
  | { ok: true; contribution: Record<string, unknown>; invoice: string }
  | { ok: false; code: 'NOT_FOUND' | 'NOT_ACCEPTING' | 'INVALID_AMOUNT' | 'INVALID_MODEL' | 'DB_ERROR'; message: string };

export async function createResearchContribution(
  supabase: AnyClient,
  researchEntityId: string,
  userId: string | null,
  body: { amount: number; currency?: string; funding_model: string; message?: string; anonymous?: boolean }
): Promise<CreateContributionResult> {
  const { data: entity, error: entityError } = await supabase
    .from(DATABASE_TABLES.RESEARCH_ENTITIES)
    .select('id, is_public, funding_goal, funding_goal_currency, funding_raised_btc, status')
    .eq('id', researchEntityId)
    .single();

  if (entityError) {
    if (entityError.code === 'PGRST116') {return { ok: false, code: 'NOT_FOUND', message: 'Research entity not found' };}
    throw entityError;
  }

  if (!entity.is_public) {return { ok: false, code: 'NOT_ACCEPTING', message: 'Cannot contribute to private research entities' };}
  if (entity.status === PROJECT_STATUS.COMPLETED || entity.status === PROJECT_STATUS.CANCELLED) {
    return { ok: false, code: 'NOT_ACCEPTING', message: 'This research entity is no longer accepting contributions' };
  }

  const { amount, currency, funding_model, message, anonymous } = body;

  if (!amount || amount <= 0) {return { ok: false, code: 'INVALID_AMOUNT', message: 'Valid contribution amount is required' };}

  const amountBtc = convertToBtc(amount, currency || 'BTC');
  if (amountBtc < MIN_AMOUNT_BTC) {return { ok: false, code: 'INVALID_AMOUNT', message: 'Minimum contribution is 0.00001 BTC' };}
  if (!VALID_FUNDING_MODELS.includes(funding_model)) {return { ok: false, code: 'INVALID_MODEL', message: 'Invalid funding model' };}

  const satsAmount = Math.round(amountBtc * 100_000_000);
  const invoice = `lnbc${satsAmount}...`; // Placeholder

  const { data: contribution, error } = await supabase
    .from(DATABASE_TABLES.RESEARCH_CONTRIBUTIONS)
    .insert({
      research_entity_id: researchEntityId,
      user_id: anonymous ? null : userId,
      amount_btc: amountBtc,
      funding_model,
      message,
      anonymous: anonymous || false,
      lightning_invoice: invoice,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create research contribution', { researchEntityId, error: error.message });
    return { ok: false, code: 'DB_ERROR', message: 'Failed to create contribution' };
  }

  // Update funding total
  await (supabase.rpc as unknown as (name: string, params: Record<string, unknown>) => Promise<unknown>)(
    'update_research_funding',
    { research_entity_id: researchEntityId, amount_btc: amountBtc }
  );

  logger.info('Research contribution created', {
    researchEntityId,
    contributionId: contribution.id,
    amountBtc,
    anonymous,
    userId,
  });

  return { ok: true, contribution: contribution as Record<string, unknown>, invoice };
}

export function computeContributionStats(contributions: Array<{ amount_btc: number; funding_model: string }>) {
  const totalAmountBtc = contributions.reduce((sum, c) => sum + c.amount_btc, 0);
  const fundingSources: Record<string, number> = {};
  for (const c of contributions) {
    fundingSources[c.funding_model] = (fundingSources[c.funding_model] || 0) + c.amount_btc;
  }
  return {
    total_contributors: contributions.length,
    total_amount_btc: totalAmountBtc,
    average_contribution: contributions.length ? totalAmountBtc / contributions.length : 0,
    funding_sources: fundingSources,
  };
}
