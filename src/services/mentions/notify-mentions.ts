/**
 * Telling someone they were mentioned.
 *
 * The `mention` notification type has existed since the notification config was
 * written: it has copy, an icon case in NotificationItem.tsx, and a place in the
 * type union. Nothing has ever created one. Mentioning a person on OrangeCat
 * notified nobody, which makes the mention syntax decorative — you can write
 * `@alice` and she will never know.
 *
 * WHY ONLY PUBLIC POSTS
 * Mentions inside a private conversation are deliberately NOT notified here,
 * and that is a privacy decision rather than an omission:
 *
 *   - a participant already gets a `new_message` notification, so a second one
 *     for being named in it is noise;
 *   - a NON-participant must never be told. The notification would disclose
 *     that a conversation exists, who is in it, and — through the preview — part
 *     of what was said. Someone typing a friend's handle in a private chat is
 *     not publishing to them.
 *
 * A post is public (or scoped by its own visibility), so notifying the people
 * named in it is exactly what the author intended by naming them.
 */

import { NotificationDispatcher } from '@/services/notifications/dispatcher';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import type { ResolvedMention } from '@/services/mentions/resolve';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface NotifyMentionsInput {
  mentions: ResolvedMention[];
  /** Who wrote the post. Never notified about their own mention. */
  authorId: string;
  /** The post the mention appears in, for the link. */
  eventId: string;
  /** The post's text, trimmed for the notification body. */
  excerpt: string;
}

/** How much of the post the notification quotes back. */
const EXCERPT_LIMIT = 140;

/**
 * @returns how many people were notified. Never throws — a notification that
 *   fails must not cost the post or the Cat's reply.
 */
export async function notifyMentionedPeople(
  admin: SupabaseClient,
  input: NotifyMentionsInput
): Promise<number> {
  const recipients = input.mentions.filter(
    // Not the Cat: it has no inbox and does not need telling.
    // Not the author: naming yourself is not news.
    mention => !mention.isCat && mention.id !== input.authorId
  );

  if (recipients.length === 0) {
    return 0;
  }

  const authorName = await displayName(admin, input.authorId);
  const excerpt = input.excerpt.trim().slice(0, EXCERPT_LIMIT);
  let sent = 0;

  for (const recipient of recipients) {
    try {
      await NotificationDispatcher.dispatch({
        userId: recipient.id,
        type: 'mention',
        title: `${authorName} mentioned you`,
        message: excerpt || `${authorName} mentioned you in a post.`,
        sourceEntityType: 'timeline_event',
        sourceEntityId: input.eventId,
        actionUrl: `/posts/${input.eventId}`,
        data: { mentionerName: authorName, context: 'a post' },
      });
      sent += 1;
    } catch (error) {
      logger.error(
        'Failed to notify a mentioned person',
        { recipient: recipient.id, error: error instanceof Error ? error.message : String(error) },
        'Mentions'
      );
    }
  }
  return sent;
}

async function displayName(admin: SupabaseClient, userId: string): Promise<string> {
  const { data } = await admin
    .from(DATABASE_TABLES.PROFILES)
    .select('name, username')
    .eq('id', userId)
    .maybeSingle();

  const row = data as { name: string | null; username: string | null } | null;
  return row?.name?.trim() || row?.username || 'Someone';
}
