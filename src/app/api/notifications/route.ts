import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, handleApiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

/**
 * GET /api/notifications
 *
 * Fetch user's notifications with pagination.
 * Supports filtering by read status and type.
 *
 * Query params:
 * - limit: number (default 20, max 100)
 * - offset: number (default 0)
 * - filter: 'all' | 'unread' | type string
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
      .select(
        `
        id,
        type,
        title,
        message,
        action_url,
        read,
        read_at,
        created_at,
        metadata,
        source_actor_id,
        source_entity_type,
        source_entity_id,
        source_actor:actors!source_actor_id (
          id,
          display_name,
          avatar_url,
          actor_type
        )
      `,
        { count: 'exact' }
      )
      .eq('recipient_user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filter
    if (filter === 'unread') {
      query = query.eq('read', false);
    } else if (filter !== 'all') {
      // Filter by type
      query = query.eq('type', filter);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch notifications', { error, userId: user.id }, 'Notifications');
      throw error;
    }

    return apiSuccess({
      notifications: notifications || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Notifications API error', { error }, 'Notifications');
    return handleApiError(error);
  }
});

/**
 * DELETE /api/notifications
 *
 * Clear all read notifications or specific notification by ID.
 *
 * Query params:
 * - id: specific notification ID to delete
 * - clear: 'read' to clear all read notifications
 */
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;
    const { searchParams } = new URL(req.url);

    const notificationId = searchParams.get('id');
    const clearType = searchParams.get('clear');

    const admin = createAdminClient();

    if (notificationId) {
      // Delete specific notification
      const { error } = await admin
        .from(DATABASE_TABLES.NOTIFICATIONS)
        .delete()
        .eq('id', notificationId)
        .eq('recipient_user_id', user.id);

      if (error) {
        throw error;
      }

      return apiSuccess({ deleted: 1 });
    } else if (clearType === 'read') {
      // Clear all read notifications
      const { error, count } = await admin
        .from(DATABASE_TABLES.NOTIFICATIONS)
        .delete()
        .eq('recipient_user_id', user.id)
        .eq('read', true);

      if (error) {
        throw error;
      }

      return apiSuccess({ deleted: count || 0 });
    } else if (clearType === 'all') {
      // Clear all notifications
      const { error, count } = await admin
        .from(DATABASE_TABLES.NOTIFICATIONS)
        .delete()
        .eq('recipient_user_id', user.id);

      if (error) {
        throw error;
      }

      return apiSuccess({ deleted: count || 0 });
    }

    return apiSuccess({ deleted: 0 });
  } catch (error) {
    logger.error('Delete notifications error', { error }, 'Notifications');
    return handleApiError(error);
  }
});
