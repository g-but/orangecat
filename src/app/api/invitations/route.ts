/**
 * User Invitations API
 *
 * Handles fetching and responding to invitations for the current user.
 *
 * GET /api/invitations - Get pending invitations for current user
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, handleApiError } from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

/**
 * GET /api/invitations
 * Get pending invitations for current user
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;
    const supabase = await createServerClient();

    // Get pending invitations with group details
    const { data, error } = await supabase
      .from(DATABASE_TABLES.GROUP_INVITATIONS)
      .select(
        `
        id,
        role,
        message,
        expires_at,
        created_at,
        groups!inner (
          id,
          name,
          slug,
          description,
          avatar_url,
          label
        ),
        inviter:profiles!group_invitations_invited_by_fkey (
          id,
          name,
          avatar_url
        )
      `
      )
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch user invitations', { error, userId: user.id }, 'Groups');
      return handleApiError(error);
    }

    // Transform the data for cleaner response
    const invitations = (data || []).map((inv: Record<string, unknown>) => {
      const group = inv.groups as {
        id: string;
        name: string;
        slug: string;
        description?: string;
        avatar_url?: string;
        label: string;
      };
      const inviter = inv.inviter as { id: string; name?: string; avatar_url?: string } | null;

      return {
        id: inv.id,
        role: inv.role,
        message: inv.message,
        expires_at: inv.expires_at,
        created_at: inv.created_at,
        group: {
          id: group.id,
          name: group.name,
          slug: group.slug,
          description: group.description,
          avatar_url: group.avatar_url,
          label: group.label,
        },
        inviter: inviter
          ? {
              id: inviter.id,
              name: inviter.name,
              avatar_url: inviter.avatar_url,
            }
          : null,
      };
    });

    return apiSuccess({
      invitations,
      count: invitations.length,
    });
  } catch (error) {
    logger.error('User invitations GET error', { error }, 'Groups');
    return handleApiError(error);
  }
});
