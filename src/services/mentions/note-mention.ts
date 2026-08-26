/**
 * The one function a write path calls after storing something a person wrote.
 *
 * Kept separate from both the queue and the messaging helpers on purpose. The
 * messaging layer should not know how the Cat is resolved or queued, and the
 * queue should not know what a conversation is; this is the thin seam between
 * them, and it is the only thing a new surface (wall posts, group chat) has to
 * call to gain the same behaviour.
 */

import { CAT_USERNAME } from '@/config/cat-identity';
import { DATABASE_TABLES } from '@/config/database-tables';
import { normalizeUsername } from '@/config/usernames';
import { resolveMentions } from '@/services/mentions/resolve';
import { enqueueCatMention } from '@/services/mentions/queue';
import { logger } from '@/utils/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface NoteMentionInput {
  conversationId: string;
  /**
   * The message row id. Required, and the reason is the unique key: it is what
   * makes one mention owe one reply. Keying on the conversation instead would
   * mean the FIRST question ever asked there is the only one answered, because
   * every later insert would collide and be treated as already queued.
   */
  messageId: string;
  senderId: string;
  content: string;
}

/**
 * Notice that a message tagged the Cat, and record that a reply is owed.
 *
 * Never throws: a message is a person's words and must be stored whatever the
 * Cat is doing. Everything here is best-effort around a write that has already
 * succeeded.
 */
export async function noteCatMention(
  admin: SupabaseClient,
  input: NoteMentionInput
): Promise<boolean> {
  try {
    // Cheap exit for the overwhelming majority of messages: no '@', no lookup.
    if (!input.content.includes('@')) {
      return false;
    }

    const { mentionsCat } = await resolveMentions(admin, input.content);
    if (!mentionsCat) {
      return false;
    }

    // The Cat does not answer itself — otherwise a reply containing the handle
    // would queue another reply, forever.
    const isFromCat = await senderIsCat(admin, input.senderId);
    if (isFromCat) {
      return false;
    }

    return await enqueueCatMention(admin, {
      sourceType: 'message',
      sourceId: input.messageId,
      requesterId: input.senderId,
      conversationId: input.conversationId,
    });
  } catch (error) {
    logger.error(
      'Failed while noting a Cat mention',
      { error: error instanceof Error ? error.message : String(error) },
      'CatMentions'
    );
    return false;
  }
}

async function senderIsCat(admin: SupabaseClient, senderId: string): Promise<boolean> {
  const { data } = await admin
    .from(DATABASE_TABLES.PROFILES)
    .select('username')
    .eq('id', senderId)
    .maybeSingle();
  const username = data?.username as string | undefined;
  return username ? normalizeUsername(username) === normalizeUsername(CAT_USERNAME) : false;
}
