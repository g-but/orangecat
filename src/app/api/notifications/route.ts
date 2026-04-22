import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, handleApiError, apiRateLimited } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

/**
 * GET /api/notifications
 *
 * Fetch user's notifications with pagination.
 * Query params: limit (default 20, max 100), offset (default 0), filter ('all' | 'unread' | type)
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter') || 'all';

    const admin = createAdminClient();
    let query = admin
      .from(DATABASE_TABLES.NOTIFICATIONS)
      .select(`id, type, title, message, action_url, read, read_at, created_at, metadata,
        source_actor_id, source_entity_type, source_entity_id,
        source_actor:actors!source_actor_id (id, actor_type, user_id, profiles:user_id (name, avatar_url))`,
        { count: 'exact' })
      .eq('recipient_user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter === 'unread') {query = query.eq('read', false);}
    else if (filter !== 'all') {query = query.eq('type', filter);}

    const { data: notifications, error, count } = await query;
    if (error) {
      logger.error('Failed to fetch notifications', { error, userId: user.id }, 'Notifications');
      throw error;
    }

    return apiSuccess({ notifications: notifications || [], total: count || 0, limit, offset });
  } catch (error) {
    logger.error('Notifications API error', { error }, 'Notifications');
    return handleApiError(error);
  }
});

/**
 * DELETE /api/notifications
 *
 * Clear notifications. Query params:
 * - id: specific notification ID to delete
 * - clear: 'read' | 'all' to bulk-clear
 */
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));}

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');
    const clearType = searchParams.get('clear');

    const admin = createAdminClient();
    let deleteQuery = admin.from(DATABASE_TABLES.NOTIFICATIONS).delete().eq('recipient_user_id', user.id);

    if (notificationId) {
      deleteQuery = deleteQuery.eq('id', notificationId);
    } else if (clearType === 'read') {
      deleteQuery = deleteQuery.eq('read', true);
    } else if (clearType !== 'all') {
      return apiSuccess({ deleted: 0 });
    }

    const { error, count } = await deleteQuery;
    if (error) {throw error;}

    return apiSuccess({ deleted: notificationId ? 1 : (count || 0) });
  } catch (error) {
    logger.error('Delete notifications error', { error }, 'Notifications');
    return handleApiError(error);
  }
});
