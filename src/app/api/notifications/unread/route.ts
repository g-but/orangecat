import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';

/**
 * GET /api/notifications/unread
 *
 * Get count of unread notifications.
 * Used for the notification badge in the header.
 *
 * Uses the user's authenticated session with RLS - no admin client needed.
 * RLS policy: "Users can view own notifications" ensures users only see their own.
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user, supabase } = req;

    // Use user's authenticated session - RLS handles authorization
    // NOTE: Table uses 'user_id' and 'is_read' (not 'recipient_user_id' and 'read')
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      logger.error(
        'Failed to get unread count',
        {
          error: {
            message: error.message || 'Empty message',
            code: error.code,
            hint: error.hint,
            details: error.details,
            name: error.name,
          },
          userId: user.id,
        },
        'Notifications'
      );
      // Return a proper error response instead of throwing
      // This prevents "Unexpected end of JSON input" errors
      return apiError(
        error.message || 'Failed to fetch notifications',
        error.code || 'DATABASE_ERROR',
        500
      );
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
    const errorInfo =
      error instanceof Error
        ? { message: error.message, name: error.name, stack: error.stack?.slice(0, 500) }
        : error;
    logger.error('Unread notifications count error', { error: errorInfo }, 'Notifications');
    return apiError(
      error instanceof Error ? error.message : 'Failed to fetch notification count',
      'NOTIFICATIONS_ERROR',
      500
    );
  }
});
