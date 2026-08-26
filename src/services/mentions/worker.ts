/**
 * Paying the debts in the queue.
 *
 * Deliberately small and dumb: claim, dispatch, mark. Everything that decides
 * WHAT the Cat says lives in cat-reply.ts, and everything that decides whether
 * a mention exists lives in the resolver — so this file can be read in one sitting
 * and changed without touching either.
 */

import { ensureCatAccount } from '@/services/mentions/cat-account';
import { replyToConversationMention } from '@/services/mentions/cat-reply';
import {
  claimCatMentions,
  completeCatMention,
  failCatMention,
  type ClaimedMention,
} from '@/services/mentions/queue';
import { logger } from '@/utils/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MentionRunResult {
  claimed: number;
  answered: number;
  failed: number;
}

/** How many mentions one tick will answer. Keeps a burst from monopolising the LLM budget. */
export const DEFAULT_BATCH = 5;

export async function runCatMentions(
  admin: SupabaseClient,
  limit: number = DEFAULT_BATCH
): Promise<MentionRunResult> {
  const result: MentionRunResult = { claimed: 0, answered: 0, failed: 0 };

  const claimed = await claimCatMentions(admin, limit);
  result.claimed = claimed.length;
  if (claimed.length === 0) {
    return result;
  }

  // Established once per tick rather than per mention: it is one indexed lookup
  // when it is a no-op, and without it there is no sender to speak as.
  const cat = await ensureCatAccount(admin);
  if (!cat) {
    for (const mention of claimed) {
      await failCatMention(admin, mention, 'no Cat account');
    }
    result.failed = claimed.length;
    return result;
  }

  for (const mention of claimed) {
    try {
      const answered = await answer(admin, mention, cat.id);
      if (answered) {
        await completeCatMention(admin, mention.id);
        result.answered += 1;
      } else {
        await failCatMention(admin, mention, 'nothing to answer');
        result.failed += 1;
      }
    } catch (error) {
      await failCatMention(
        admin,
        mention,
        error instanceof Error ? error.message : String(error)
      );
      result.failed += 1;
    }
  }

  if (result.answered > 0 || result.failed > 0) {
    logger.info('Cat mention run', { ...result }, 'CatMentions');
  }
  return result;
}

async function answer(
  admin: SupabaseClient,
  mention: ClaimedMention,
  catId: string
): Promise<boolean> {
  if (mention.conversation_id) {
    return replyToConversationMention(admin, {
      conversationId: mention.conversation_id,
      requesterId: mention.requester_id,
      catId,
    });
  }
  // Wall posts are queued by the same table but answered by a later change;
  // until then such a row would be retried forever, so it fails fast instead.
  return false;
}
