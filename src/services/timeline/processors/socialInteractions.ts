/**
 * Timeline Social Interactions
 * 
 * Handles likes, dislikes, comments, and shares for timeline events.
 * 
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted social interaction logic from monolithic timeline service
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { withApiRetry } from '@/utils/retry';
import { DATABASE_TABLES } from '@/config/database-tables';
import type { TimelineVisibility } from '@/types/timeline';

/**
 * Get current user ID helper
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    logger.error('Error getting current user ID', error, 'Timeline');
    return null;
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
    return await withApiRetry(async () => {
      const targetUserId = userId || (await getCurrentUserId());
      if (!targetUserId) {
        return { success: false, liked: false, likeCount: 0, error: 'Authentication required' };
      }

      // Check if user already liked this event
      const { data: existingLike } = await supabase
        .from(DATABASE_TABLES.TIMELINE_LIKES)
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', targetUserId)
        .single();

      if (existingLike) {
        // Unlike the event
        try {
          const { data, error } = await (supabase.rpc as any)('unlike_timeline_event', {
            p_event_id: eventId,
            p_user_id: targetUserId,
          });

          if (error) {
            logger.error('Failed to unlike timeline event', error, 'Timeline');
            return { success: false, liked: false, likeCount: 0, error: error.message };
          }

          return {
            success: true,
            liked: false,
            likeCount: (data as any)?.like_count || 0,
          };
        } catch (dbError) {
          logger.warn(
            'Database function not available for unlike, using fallback',
            dbError,
            'Timeline'
          );
          const { error: delErr } = await supabase
            .from(DATABASE_TABLES.TIMELINE_LIKES)
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', targetUserId);
          if (delErr) {
            logger.error('Fallback unlike failed', delErr, 'Timeline');
            return { success: false, liked: false, likeCount: 0, error: delErr.message };
          }
          const { count } = await supabase
            .from(DATABASE_TABLES.TIMELINE_LIKES)
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);
          return { success: true, liked: false, likeCount: count || 0 };
        }
      } else {
        // Like the event
        try {
          const { data, error } = await (supabase.rpc as any)('like_timeline_event', {
            p_event_id: eventId,
            p_user_id: targetUserId,
          });

          if (error) {
            logger.error('Failed to like timeline event', error, 'Timeline');
            return { success: false, liked: false, likeCount: 0, error: error.message };
          }

          return {
            success: true,
            liked: true,
            likeCount: (data as any)?.like_count || 0,
          };
        } catch (dbError) {
          logger.warn(
            'Database function not available for like, using fallback',
            dbError,
            'Timeline'
          );
          // Fallback: insert into timeline_likes and return new count
          const { error: insertErr } = await supabase
            .from(DATABASE_TABLES.TIMELINE_LIKES)
            .insert({ event_id: eventId, user_id: targetUserId } as any);
          if (insertErr) {
            logger.error('Fallback like failed', insertErr, 'Timeline');
            return { success: false, liked: false, likeCount: 0, error: insertErr.message };
          }
          const { count } = await supabase
            .from(DATABASE_TABLES.TIMELINE_LIKES)
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);
          return { success: true, liked: true, likeCount: count || 0 };
        }
      }
    }, { maxAttempts: 2 }); // Only retry once for likes to avoid spam
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

    // Check if user already disliked this event
    const { data: existingDislike } = await supabase
      .from(DATABASE_TABLES.TIMELINE_DISLIKES)
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', targetUserId)
      .single();

    if (existingDislike) {
      // Undislike the event
      try {
        const { data, error } = await (supabase.rpc as any)('undislike_timeline_event', {
          p_event_id: eventId,
          p_user_id: targetUserId,
        });

        if (error) {
          logger.error('Failed to undislike timeline event', error, 'Timeline');
          return { success: false, disliked: false, dislikeCount: 0, error: error.message };
        }

        return {
          success: true,
          disliked: false,
          dislikeCount: (data as any)?.dislike_count || 0,
        };
      } catch (dbError) {
        logger.warn(
          'Database function not available for undislike, using fallback',
          dbError,
          'Timeline'
        );
        const { error: delErr } = await supabase
          .from(DATABASE_TABLES.TIMELINE_DISLIKES)
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', targetUserId);
        if (delErr) {
          logger.error('Fallback undislike failed', delErr, 'Timeline');
          return { success: false, disliked: false, dislikeCount: 0, error: delErr.message };
        }
        const { count } = await supabase
          .from(DATABASE_TABLES.TIMELINE_DISLIKES)
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);
        return { success: true, disliked: false, dislikeCount: count || 0 };
      }
    } else {
      // Dislike the event
      try {
        const { data, error } = await (supabase.rpc as any)('dislike_timeline_event', {
          p_event_id: eventId,
          p_user_id: targetUserId,
        });

        if (error) {
          logger.error('Failed to dislike timeline event', error, 'Timeline');
          return { success: false, disliked: false, dislikeCount: 0, error: error.message };
        }

        return {
          success: true,
          disliked: true,
          dislikeCount: (data as any)?.dislike_count || 0,
        };
      } catch (dbError) {
        logger.warn(
          'Database function not available for dislike, using fallback',
          dbError,
          'Timeline'
        );
        // Fallback: insert into timeline_dislikes and return new count
        const { error: insertErr } = await supabase
          .from(DATABASE_TABLES.TIMELINE_DISLIKES)
          .insert({ event_id: eventId, user_id: targetUserId } as any);
        if (insertErr) {
          logger.error('Fallback dislike failed', insertErr, 'Timeline');
          return { success: false, disliked: false, dislikeCount: 0, error: insertErr.message };
        }
        const { count } = await supabase
          .from(DATABASE_TABLES.TIMELINE_DISLIKES)
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);
        return { success: true, disliked: true, dislikeCount: count || 0 };
      }
    }
  } catch (error) {
    logger.error('Error toggling dislike on timeline event', error, 'Timeline');
    return { success: false, disliked: false, dislikeCount: 0, error: 'Internal server error' };
  }
}

/**
 * Add a comment to an event
 */
export async function addComment(
  eventId: string,
  content: string,
  parentCommentId?: string,
  createEventFn?: (request: any) => Promise<any>
): Promise<{ success: boolean; commentId?: string; commentCount: number; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, commentCount: 0, error: 'Authentication required' };
    }

    try {
      const { data, error } = await (supabase.rpc as any)('add_timeline_comment', {
        p_event_id: eventId,
        p_user_id: userId,
        p_content: content,
        p_parent_comment_id: parentCommentId,
      });

      if (error) {
        logger.error('Failed to add timeline comment', error, 'Timeline');
        return { success: false, commentCount: 0, error: error.message };
      }

      return {
        success: true,
        commentId: (data as any)?.comment_id,
        commentCount: (data as any)?.comment_count || 0,
      };
    } catch (dbError) {
      logger.warn(
        'Database function not available for comments, using fallback',
        dbError,
        'Timeline'
      );
      // Fallback: insert directly into timeline_comments
      const { data: inserted, error: iErr } = await supabase
        .from(DATABASE_TABLES.TIMELINE_COMMENTS)
        .insert({
          event_id: eventId,
          user_id: userId,
          content,
          parent_comment_id: parentCommentId,
        } as any)
        .select('id')
        .single();
      if (iErr || !inserted) {
        logger.error('Fallback add comment failed', iErr, 'Timeline');
        return { success: false, commentCount: 0, error: iErr?.message || 'Add comment failed' };
      }
      const { count } = await supabase
        .from(DATABASE_TABLES.TIMELINE_COMMENTS)
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
      return { success: true, commentId: (inserted as any).id, commentCount: count || 0 };
    }
  } catch (error) {
    logger.error('Error adding timeline comment', error, 'Timeline');
    return { success: false, commentCount: 0, error: 'Internal server error' };
  }
}

/**
 * Update a comment's content
 */
export async function updateComment(
  commentId: string,
  content: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const targetUserId = userId || (await getCurrentUserId());
    if (!targetUserId) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const { error } = await (supabase.rpc as any)('update_timeline_comment', {
        p_comment_id: commentId,
        p_user_id: targetUserId,
        p_content: content,
      });

      if (error) {
        logger.error('Failed to update timeline comment', error, 'Timeline');
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (dbError) {
      logger.warn(
        'Database function not available for comment updates, using fallback',
        dbError,
        'Timeline'
      );
      // Fallback: update directly in timeline_comments table
      const { error: updateErr } = await (supabase
        .from(DATABASE_TABLES.TIMELINE_COMMENTS) as any)
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', targetUserId);

      if (updateErr) {
        logger.error('Fallback update comment failed', updateErr, 'Timeline');
        return { success: false, error: updateErr.message };
      }

      return { success: true };
    }
  } catch (error) {
    logger.error('Error updating timeline comment', error, 'Timeline');
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(
  commentId: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const targetUserId = userId || (await getCurrentUserId());
    if (!targetUserId) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const { error } = await (supabase.rpc as any)('delete_timeline_comment', {
        p_comment_id: commentId,
        p_user_id: targetUserId,
      });

      if (!error) {
        return { success: true };
      }

      // If the RPC is missing or failed, fall back to direct table update
      logger.warn(
        'RPC delete_timeline_comment failed, attempting direct delete fallback',
        error,
        'Timeline'
      );
    } catch (dbError) {
      logger.warn(
        'Database function not available for comment deletion, using fallback',
        dbError,
        'Timeline'
      );
    }

    // Fallback: soft delete by updating deleted_at timestamp
    const { error: deleteErr } = await (supabase
      .from(DATABASE_TABLES.TIMELINE_COMMENTS) as any)
      .update({
        deleted_at: new Date().toISOString(),
        content: '[deleted]',
      })
      .eq('id', commentId)
      .eq('user_id', targetUserId)
      .is('deleted_at', null);

    if (deleteErr) {
      logger.error('Fallback delete comment failed', deleteErr, 'Timeline');
      return { success: false, error: deleteErr.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Error deleting timeline comment', error, 'Timeline');
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get like/comment counts for an event (fallback for feeds lacking counts)
 */
export async function getEventCounts(eventId: string): Promise<{ likeCount: number; commentCount: number }> {
  try {
    const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
      supabase
        .from(DATABASE_TABLES.TIMELINE_LIKES)
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId),
      supabase
        .from(DATABASE_TABLES.TIMELINE_COMMENTS)
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId),
    ]);
    return { likeCount: likeCount || 0, commentCount: commentCount || 0 };
  } catch (error) {
    logger.error('Failed to get event counts', error, 'Timeline');
    return { likeCount: 0, commentCount: 0 };
  }
}

/**
 * Get comments for an event
 */
export async function getEventComments(eventId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
  try {
    try {
      const { data, error } = await (supabase.rpc as any)('get_event_comments', {
        p_event_id: eventId,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        logger.error('Failed to get event comments', error, 'Timeline');
        return [];
      }

      return data || [];
    } catch (dbError) {
      logger.warn(
        'Database function not available for comments, using fallback',
        dbError,
        'Timeline'
      );
      // Fallback: query comments table directly and enrich with profile info
      const { data: comments, error: cErr } = await supabase
        .from(DATABASE_TABLES.TIMELINE_COMMENTS)
        .select('id, event_id, user_id, content, created_at, parent_comment_id')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
      if (cErr || !comments) {
        logger.error('Fallback comments query failed', cErr, 'Timeline');
        return [];
      }
      const commentsData = comments as any[];
      const userIds = Array.from(new Set(commentsData.map(c => c.user_id).filter(Boolean)));
      let profilesMap: Record<
        string,
        { display_name: string; username: string | null; avatar_url: string | null }
      > = {};
      if (userIds.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from(DATABASE_TABLES.PROFILES)
          .select('id, display_name, username, avatar_url')
          .in('id', userIds as string[]);
        if (!pErr && profiles) {
          profilesMap = Object.fromEntries(
            (profiles as any[]).map((p: any) => [
              p.id,
              { display_name: p.display_name, username: p.username, avatar_url: p.avatar_url },
            ])
          );
        }
      }
      return commentsData.map(c => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        user_name: profilesMap[c.user_id]?.display_name || 'User',
        user_username: profilesMap[c.user_id]?.username || null,
        user_avatar: profilesMap[c.user_id]?.avatar_url || null,
        reply_count: 0,
      }));
    }
  } catch (error) {
    logger.error('Error getting event comments', error, 'Timeline');
    return [];
  }
}

/**
 * Get replies to a comment
 */
export async function getCommentReplies(commentId: string, limit: number = 20): Promise<any[]> {
  try {
    try {
      const { data, error } = await (supabase.rpc as any)('get_comment_replies', {
        p_comment_id: commentId,
        p_limit: limit,
      });

      if (error) {
        logger.error('Failed to get comment replies', error, 'Timeline');
        return [];
      }

      return data || [];
    } catch (dbError) {
      logger.warn(
        'Database function not available for comment replies, using fallback',
        dbError,
        'Timeline'
      );
      const { data: replies, error: rErr } = await supabase
        .from(DATABASE_TABLES.TIMELINE_COMMENTS)
        .select('id, event_id, user_id, content, created_at, parent_comment_id')
        .eq('parent_comment_id', commentId)
        .order('created_at', { ascending: true })
        .limit(limit);
      if (rErr || !replies) {
        logger.error('Fallback replies query failed', rErr, 'Timeline');
        return [];
      }
      const repliesData = replies as any[];
      const userIds = Array.from(new Set(repliesData.map(c => c.user_id).filter(Boolean)));
      let profilesMap: Record<
        string,
        { display_name: string; username: string | null; avatar_url: string | null }
      > = {};
      if (userIds.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from(DATABASE_TABLES.PROFILES)
          .select('id, display_name, username, avatar_url')
          .in('id', userIds as string[]);
        if (!pErr && profiles) {
          profilesMap = Object.fromEntries(
            (profiles as any[]).map((p: any) => [
              p.id,
              { display_name: p.display_name, username: p.username, avatar_url: p.avatar_url },
            ])
          );
        }
      }
      return repliesData.map(c => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        user_name: profilesMap[c.user_id]?.display_name || 'User',
        user_username: profilesMap[c.user_id]?.username || null,
        user_avatar: profilesMap[c.user_id]?.avatar_url || null,
        reply_count: 0,
      }));
    }
  } catch (error) {
    logger.error('Error getting comment replies', error, 'Timeline');
    return [];
  }
}

