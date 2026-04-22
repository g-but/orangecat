/**
 * Research Vote Service
 *
 * Business logic for aggregating and casting research votes.
 */

import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const VALID_VOTE_TYPES = ['direction', 'priority', 'impact', 'continuation'] as const;

export interface VoteSummary {
  total_votes: number;
  by_type: Record<string, Record<string, number>>;
  user_vote: Record<string, string> | null;
}

interface VoteRow {
  id: string;
  research_entity_id: string;
  user_id: string;
  vote_type: string;
  choice: string;
  weight: number;
}

/** Pure function — aggregates raw vote rows into a summary object */
export function aggregateVotes(votes: VoteRow[], userId: string | null): VoteSummary {
  const summary: VoteSummary = { total_votes: votes.length, by_type: {}, user_vote: null };

  for (const vote of votes) {
    if (!summary.by_type[vote.vote_type]) {summary.by_type[vote.vote_type] = {};}
    summary.by_type[vote.vote_type][vote.choice] =
      (summary.by_type[vote.vote_type][vote.choice] || 0) + vote.weight;

    if (userId && vote.user_id === userId) {
      if (!summary.user_vote) {summary.user_vote = {};}
      summary.user_vote[vote.vote_type] = vote.choice;
    }
  }

  return summary;
}

export type CastVoteResult =
  | { ok: true; vote: VoteRow }
  | { ok: false; code: 'INVALID_TYPE' | 'DB_ERROR'; message: string };

export async function castVote(
  supabase: AnyClient,
  researchEntityId: string,
  userId: string,
  voteType: string,
  choice: string,
  contributorUserIds: string[]
): Promise<CastVoteResult> {
  if (!VALID_VOTE_TYPES.includes(voteType as (typeof VALID_VOTE_TYPES)[number])) {
    return { ok: false, code: 'INVALID_TYPE', message: 'Invalid vote type' };
  }

  // Contributors get double weight
  const weight = contributorUserIds.includes(userId) ? 2.0 : 1.0;

  const { data: voteData, error } = await (supabase.from(DATABASE_TABLES.RESEARCH_VOTES) as AnyClient)
    .upsert(
      { research_entity_id: researchEntityId, user_id: userId, vote_type: voteType, choice, weight },
      { onConflict: 'research_entity_id,user_id,vote_type' }
    )
    .select()
    .single();

  if (error) {
    logger.error('Failed to cast vote', { researchEntityId, userId, voteType, error: error.message });
    return { ok: false, code: 'DB_ERROR', message: 'Failed to cast vote' };
  }

  logger.info('Vote cast successfully', { researchEntityId, userId, voteType, choice, weight });

  return { ok: true, vote: voteData as VoteRow };
}
