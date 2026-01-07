import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, handleApiError, apiValidationError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';

/**
 * POST /api/notifications/read
 *
 * Mark notifications as read.
 *
 * Body:
 * - id: single notification ID
 * - ids: array of notification IDs
 * - all: boolean to mark all as read
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;
    const body = await req.json();

    const { id, ids, all } = body as {
      id?: string;
      ids?: string[];
      all?: boolean;
    };

    const admin = createAdminClient();
    const now = new Date().toISOString();

    if (all) {
      // Mark all notifications as read
      const { error, count } = await admin
        .from('notifications')
        .update({ read: true, read_at: now })
        .eq('recipient_user_id', user.id)
        .eq('read', false);

      if (error) {throw error;}

      return apiSuccess({ marked: count || 0 });
    } else if (id) {
      // Mark single notification as read
      const { error } = await admin
        .from('notifications')
        .update({ read: true, read_at: now })
        .eq('id', id)
        .eq('recipient_user_id', user.id);

      if (error) {throw error;}

      return apiSuccess({ marked: 1 });
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      // Mark multiple notifications as read
      const { error, count } = await admin
        .from('notifications')
        .update({ read: true, read_at: now })
        .in('id', ids)
        .eq('recipient_user_id', user.id);

      if (error) {throw error;}

      return apiSuccess({ marked: count || 0 });
    }

    return apiValidationError('Must provide id, ids, or all parameter');
  } catch (error) {
    logger.error('Mark notifications read error', { error }, 'Notifications');
    return handleApiError(error);
  }
});
