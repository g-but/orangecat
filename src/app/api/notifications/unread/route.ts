import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, handleApiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';

/**
 * GET /api/notifications/unread
 *
 * Get count of unread notifications.
 * Used for the notification badge in the header.
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;

    const admin = createAdminClient();

    const { count, error } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_user_id', user.id)
      .eq('read', false);

    if (error) {
      logger.error('Failed to get unread count', { error, userId: user.id }, 'Notifications');
      throw error;
    }

    return apiSuccess(
      { count: count || 0 },
      {
        headers: {
          'Cache-Control': 'private, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    logger.error('Unread notifications count error', { error }, 'Notifications');
    return handleApiError(error);
  }
});
