import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
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
 *
 * Uses authenticated user session (RLS) and canonical column names:
 * - user_id
 * - is_read
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user, supabase } = req;
    const body = await req.json();

    const { id, ids, all } = body as {
      id?: string;
      ids?: string[];
      all?: boolean;
    };

    const now = new Date().toISOString();

    if (all) {
      const { error, count } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: now })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw error;
      }
      return apiSuccess({ marked: count || 0 });
    }

    if (id) {
      const { error, count } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: now })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw error;
      }
      return apiSuccess({ marked: count || 0 });
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      const { error, count } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: now })
        .in('id', ids)
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw error;
      }
      return apiSuccess({ marked: count || 0 });
    }

    return apiValidationError('Must provide id, ids, or all parameter');
  } catch (error) {
    logger.error('Mark notifications read error', { error }, 'Notifications');
    return handleApiError(error);
  }
});
