/**
 * Notification context for My Cat
 *
 * Fetches the user's unread in-app notifications and coalesces repeats so the
 * Cat can help with them ("what are these 18 alerts about?") instead of the
 * user having to decode raw ops messages themselves. Message-type
 * notifications are excluded — the conversations context already covers those.
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import type { NotificationSummary } from './document-context-types';

/** Raw shape read from the notifications table (title lives in metadata). */
export interface NotificationRow {
  type: string;
  message: string;
  action_url: string | null;
  created_at: string;
  metadata: { title?: string } | null;
}

/** Newest rows fetched; enough to coalesce a burst of repeated alerts. */
const FETCH_LIMIT = 30;
/** Coalesced groups actually handed to the Cat. */
const MAX_GROUPS = 8;

/**
 * Collapse repeated notifications into one summary per (type, title) with a
 * count — the nightly eval failing 18 times is ONE problem that happened 18
 * times, and the Cat should present it that way. Pure; exported for tests.
 * Rows must arrive newest-first; group order follows each group's newest row.
 */
export function coalesceNotifications(rows: NotificationRow[]): NotificationSummary[] {
  const groups = new Map<string, NotificationSummary>();
  for (const row of rows) {
    const title = row.metadata?.title ?? row.message;
    const key = `${row.type}|${title}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, {
        type: row.type,
        title,
        message: row.message,
        count: 1,
        latest_at: row.created_at,
        action_url: row.action_url,
      });
    }
  }
  return [...groups.values()].slice(0, MAX_GROUPS);
}

export async function fetchNotificationsForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<NotificationSummary[]> {
  try {
    const { data, error } = await supabase
      .from(DATABASE_TABLES.NOTIFICATIONS)
      .select('type, message, action_url, created_at, metadata')
      .eq('user_id', userId)
      .eq('is_read', false)
      .neq('type', 'message')
      .order('created_at', { ascending: false })
      .limit(FETCH_LIMIT);

    if (error) {
      logger.warn(
        'Failed to fetch notifications for cat',
        { error: error.message },
        'DocumentContext'
      );
      return [];
    }

    return coalesceNotifications((data || []) as NotificationRow[]);
  } catch (error) {
    logger.error('Exception fetching notifications for cat', error, 'DocumentContext');
    return [];
  }
}
