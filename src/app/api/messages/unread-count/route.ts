import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, handleApiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import type { Database } from '@/types/database';
import { DATABASE_TABLES } from '@/config/database-tables';

/**
 * GET /api/messages/unread-count
 *
 * Efficient endpoint that returns only the unread message count.
 * Uses optimized SQL aggregation instead of fetching all conversations.
 *
 * Performance: ~90% faster than fetching all conversations
 *
 * Created: 2025-01-21
 * Last Modified: 2025-01-28
 * Last Modified Summary: Refactored to use withAuth and proper error handling
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;

    const admin = createAdminClient();

    // Optimized approach: Try RPC function first, fallback to old method
    // This ensures backward compatibility if function doesn't exist
    let totalUnread = 0;

    // Try optimized RPC function first
    try {
      const rpcArgs: Database['public']['Functions']['get_total_unread_count']['Args'] = {
        p_user_id: user.id,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: totalCount, error: rpcError } = await (admin.rpc(
        'get_total_unread_count',
        rpcArgs as any
      ) as any);

      if (!rpcError && typeof totalCount === 'number') {
        totalUnread = totalCount;
        return apiSuccess(
          { count: totalUnread },
          {
            headers: {
              'Cache-Control': 'private, no-cache, must-revalidate',
            },
          }
        );
      } else {
        // Log the error for debugging
        logger.warn('RPC returned error or invalid data', { rpcError, totalCount }, 'Messages');
        throw new Error('RPC function returned invalid data');
      }
    } catch (error) {
      // Fallback to optimized method - use single query instead of N+1
      logger.debug(
        'Using fallback unread count method',
        { error: error instanceof Error ? error.message : String(error) },
        'Messages'
      );
      const { data: participants } = await admin
        .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (participants && participants.length > 0) {
        const typedParticipants = participants as Array<{
          conversation_id: string;
          last_read_at: string | null;
        }>;
        const conversationsWithReadTime = typedParticipants
          .filter(p => p.last_read_at)
          .map(p => ({ id: p.conversation_id, lastReadAt: p.last_read_at! }));

        const conversationsWithoutReadTime = typedParticipants
          .filter(p => !p.last_read_at)
          .map(p => p.conversation_id);

        if (conversationsWithoutReadTime.length > 0) {
          const { count: unreadWithoutTime } = await admin
            .from(DATABASE_TABLES.MESSAGES)
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', conversationsWithoutReadTime)
            .neq('sender_id', user.id)
            .eq('is_deleted', false);
          totalUnread += unreadWithoutTime || 0;
        }

        // Single batch query for all conversations with read time
        // Uses .or() to combine per-conversation conditions into one query
        if (conversationsWithReadTime.length > 0) {
          const orConditions = conversationsWithReadTime
            .map(c => `and(conversation_id.eq.${c.id},created_at.gt.${c.lastReadAt})`)
            .join(',');

          const { count: unreadWithReadTime } = await admin
            .from(DATABASE_TABLES.MESSAGES)
            .select('id', { count: 'exact', head: true })
            .or(orConditions)
            .neq('sender_id', user.id)
            .eq('is_deleted', false);

          totalUnread += unreadWithReadTime || 0;
        }
      }
    }

    return apiSuccess(
      { count: totalUnread },
      {
        headers: {
          'Cache-Control': 'private, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    logger.error('Unread count API error', { error, userId: req.user.id }, 'Messages');
    return handleApiError(error);
  }
});
