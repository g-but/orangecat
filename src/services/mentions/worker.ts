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
import { replyToPostMention } from '@/services/mentions/cat-post-reply';
import { resolveMentions } from '@/services/mentions/resolve';
import { DATABASE_TABLES } from '@/config/database-tables';
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

  // BEFORE claiming, and before the empty-queue exit, because otherwise the
  // system deadlocks on itself: resolveMentions can only flag @cat when a Cat
  // profile exists, so with no account nothing ever queues — and if the account
  // were only created when something was queued, nothing ever would be. The
  // every-minute tick is therefore also what brings the Cat into existence.
  // Cheap enough to do unconditionally: one primary-key lookup when it is a
  // no-op, which is always after the first run.
  const cat = await ensureCatAccount(admin);

  const claimed = await claimCatMentions(admin, limit);
  result.claimed = claimed.length;
  if (claimed.length === 0) {
    return result;
  }

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

  if (mention.parent_event_id) {
    // The database trigger is a PREFILTER: it queues anything containing the
    // substring "@cat", so `@catalogue` and `bob@catering.com` arrive here too.
    // The resolver is the authority, and this is where its verdict is applied —
    // detection has one implementation, not one per surface.
    if (!(await postActuallyTagsTheCat(admin, mention.parent_event_id))) {
      return true; // Nothing owed. Resolved, not failed.
    }
    return replyToPostMention(admin, { eventId: mention.parent_event_id, catId });
  }

  return false;
}

/** Ask the real resolver whether the post's text mentions the Cat. */
async function postActuallyTagsTheCat(
  admin: SupabaseClient,
  eventId: string
): Promise<boolean> {
  const { data } = await admin
    .from(DATABASE_TABLES.TIMELINE_EVENTS)
    .select('title, description')
    .eq('id', eventId)
    .maybeSingle();

  if (!data) {
    return false;
  }
  const row = data as { title: string | null; description: string | null };
  const text = `${row.description ?? ''}\n${row.title ?? ''}`;
  const { mentionsCat } = await resolveMentions(admin, text);
  return mentionsCat;
}
