/**
 * Timeline reactions (likes / dislikes). Extracted verbatim from
 * socialInteractions.ts (SoC) and re-exported from it. No behavior change.
 */

import { logger } from '@/utils/logger';
import { withApiRetry } from '@/utils/retry';
import { DATABASE_TABLES } from '@/config/database-tables';
import { db, getCurrentUserId } from './social-shared';

interface ReactionConfig {
  table: string;
  addRpc: string;
  removeRpc: string;
  /** Key in the RPC response containing the updated count, e.g. 'like_count' */
  countKey: string;
}

/**
 * Read the new count out of an RPC response.
 *
 * All four of these functions are `RETURNS TABLE(<name>_count integer)`, and
 * PostgREST renders a set-returning function as an ARRAY of rows — `[{
 * like_count: 1 }]`. This used to index the array as if it were the row, so the
 * lookup was always undefined and the `|| 0` turned every successful reaction
 * into a count of zero.
 *
 * The effect was subtle enough to survive the whole time the RPCs were also
 * raising 42703: liking something persisted correctly and then rendered as if
 * nobody had, because the button state comes from `active` (a literal) while
 * the number comes from here. Accepts either shape, so it cannot break again if
 * one of these is ever rewritten to return a scalar.
 */
function readCount(data: unknown, countKey: string): number {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') {
    return 0;
  }
  const value = (row as Record<string, unknown>)[countKey];
  return typeof value === 'number' ? value : 0;
}

async function toggleReaction(
  eventId: string,
  targetUserId: string,
  cfg: ReactionConfig
): Promise<{ success: boolean; active: boolean; count: number; error?: string }> {
  const { table, addRpc, removeRpc, countKey } = cfg;

  const { data: existing } = await db
    .from(table)
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', targetUserId)
    .single();

  if (existing) {
    // Remove reaction
    try {
      const { data, error } = await db.rpc(removeRpc, {
        p_event_id: eventId,
        p_user_id: targetUserId,
      });
      if (error) {
        logger.error(`Failed to call ${removeRpc}`, error, 'Timeline');
        return { success: false, active: false, count: 0, error: error.message };
      }
      return {
        success: true,
        active: false,
        count: readCount(data, countKey),
      };
    } catch (dbError) {
      logger.warn(`RPC ${removeRpc} not available, using fallback`, dbError, 'Timeline');
      const { error: delErr } = await db
        .from(table)
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', targetUserId);
      if (delErr) {
        logger.error(`Fallback ${removeRpc} failed`, delErr, 'Timeline');
        return { success: false, active: false, count: 0, error: delErr.message };
      }
      const { count } = await db
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
      return { success: true, active: false, count: count || 0 };
    }
  } else {
    // Add reaction
    try {
      const { data, error } = await db.rpc(addRpc, {
        p_event_id: eventId,
        p_user_id: targetUserId,
      });
      if (error) {
        logger.error(`Failed to call ${addRpc}`, error, 'Timeline');
        return { success: false, active: false, count: 0, error: error.message };
      }
      return {
        success: true,
        active: true,
        count: readCount(data, countKey),
      };
    } catch (dbError) {
      logger.warn(`RPC ${addRpc} not available, using fallback`, dbError, 'Timeline');
      const { error: insertErr } = await db
        .from(table)
        .insert({ event_id: eventId, user_id: targetUserId });
      if (insertErr) {
        logger.error(`Fallback ${addRpc} failed`, insertErr, 'Timeline');
        return { success: false, active: false, count: 0, error: insertErr.message };
      }
      const { count } = await db
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
      return { success: true, active: true, count: count || 0 };
    }
  }
}

/**
 * Like or unlike an event
 */
export async function toggleLike(
  eventId: string,
  userId?: string
): Promise<{ success: boolean; liked: boolean; likeCount: number; error?: string }> {
  try {
    return await withApiRetry(
      async () => {
        const targetUserId = userId || (await getCurrentUserId());
        if (!targetUserId) {
          return { success: false, liked: false, likeCount: 0, error: 'Authentication required' };
        }
        const r = await toggleReaction(eventId, targetUserId, {
          table: DATABASE_TABLES.TIMELINE_LIKES,
          addRpc: 'like_timeline_event',
          removeRpc: 'unlike_timeline_event',
          countKey: 'like_count',
        });
        return { success: r.success, liked: r.active, likeCount: r.count, error: r.error };
      },
      { maxAttempts: 2 } // Only retry once for likes to avoid spam
    );
  } catch (error) {
    logger.error('Error toggling like on timeline event', error, 'Timeline');
    return { success: false, liked: false, likeCount: 0, error: 'Internal server error' };
  }
}

/**
 * Toggle dislike on a timeline event (for scam detection and wisdom of crowds)
 */
export async function toggleDislike(
  eventId: string,
  userId?: string
): Promise<{ success: boolean; disliked: boolean; dislikeCount: number; error?: string }> {
  try {
    const targetUserId = userId || (await getCurrentUserId());
    if (!targetUserId) {
      return { success: false, disliked: false, dislikeCount: 0, error: 'Authentication required' };
    }
    const r = await toggleReaction(eventId, targetUserId, {
      table: DATABASE_TABLES.TIMELINE_DISLIKES,
      addRpc: 'dislike_timeline_event',
      removeRpc: 'undislike_timeline_event',
      countKey: 'dislike_count',
    });
    return { success: r.success, disliked: r.active, dislikeCount: r.count, error: r.error };
  } catch (error) {
    logger.error('Error toggling dislike on timeline event', error, 'Timeline');
    return { success: false, disliked: false, dislikeCount: 0, error: 'Internal server error' };
  }
}
