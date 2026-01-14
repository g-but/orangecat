/**
 * Groups Invitation Query Functions
 *
 * Handles fetching invitations for groups and users.
 *
 * Created: 2025-12-30
 * Last Modified: 2025-12-30
 * Last Modified Summary: Initial implementation
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { getCurrentUserId } from '../utils/helpers';
import { canPerformAction } from '../permissions/resolver';

// ==================== TYPES ====================

export interface PendingInvitation {
  id: string;
  group_id: string;
  group_name: string;
  group_slug: string;
  group_avatar_url?: string;
  role: string;
  message?: string;
  inviter_id: string;
  inviter_name?: string;
  inviter_avatar_url?: string;
  expires_at: string;
  created_at: string;
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  user_id?: string;
  email?: string;
  token?: string;
  role: string;
  message?: string;
  status: string;
  invited_by: string;
  inviter_name?: string;
  inviter_avatar_url?: string;
  user_name?: string;
  user_avatar_url?: string;
  expires_at: string;
  created_at: string;
  responded_at?: string;
}

export interface UserInvitationsResponse {
  success: boolean;
  invitations?: PendingInvitation[];
  error?: string;
}

export interface GroupInvitationsResponse {
  success: boolean;
  invitations?: GroupInvitation[];
  total?: number;
  error?: string;
}

// ==================== USER INVITATIONS ====================

/**
 * Get pending invitations for the current user
 */
export async function getUserPendingInvitations(): Promise<UserInvitationsResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Use the database function for optimized query
    const { data, error } = await (supabase.rpc as any)('get_user_pending_invitations', {
      user_uuid: userId,
    });

    if (error) {
      logger.error('Failed to get pending invitations', error, 'Groups');
      return { success: false, error: error.message };
    }

    const invitations: PendingInvitation[] = (data || []).map((inv: Record<string, unknown>) => ({
      id: inv.id as string,
      group_id: inv.group_id as string,
      group_name: inv.group_name as string,
      group_slug: inv.group_slug as string,
      group_avatar_url: inv.group_avatar_url as string | undefined,
      role: inv.role as string,
      message: inv.message as string | undefined,
      inviter_id: inv.inviter_id as string,
      inviter_name: inv.inviter_name as string | undefined,
      inviter_avatar_url: inv.inviter_avatar_url as string | undefined,
      expires_at: inv.expires_at as string,
      created_at: inv.created_at as string,
    }));

    return { success: true, invitations };
  } catch (error) {
    logger.error('Exception getting pending invitations', error, 'Groups');
    return { success: false, error: 'Failed to get invitations' };
  }
}

/**
 * Get invitation count for notification badge
 */
export async function getUserInvitationCount(): Promise<number> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return 0;
    }

    const { count, error } = await (supabase
      .from('group_invitations') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      logger.error('Failed to get invitation count', error, 'Groups');
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error('Exception getting invitation count', error, 'Groups');
    return 0;
  }
}

// ==================== GROUP INVITATIONS ====================

/**
 * Get all invitations for a group (for admins)
 */
export async function getGroupInvitations(
  groupId: string,
  options?: {
    status?: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked' | 'all';
    limit?: number;
    offset?: number;
  }
): Promise<GroupInvitationsResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Check permissions
    const permResult = await canPerformAction(userId, groupId, 'invite_members');
    if (!permResult.allowed) {
      return { success: false, error: permResult.reason || 'Insufficient permissions' };
    }

    const limit = Math.min(options?.limit || 20, 100);
    const offset = options?.offset || 0;
    const status = options?.status || 'all';

    // Build query
    let query = (supabase
      .from('group_invitations') as any)
      .select(
        `
        *,
        inviter:profiles!group_invitations_invited_by_fkey (
          name,
          avatar_url
        ),
        user:profiles!group_invitations_user_id_fkey (
          name,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error('Failed to get group invitations', error, 'Groups');
      return { success: false, error: error.message };
    }

    const invitations: GroupInvitation[] = (data || []).map((inv: Record<string, unknown>) => {
      const inviter = inv.inviter as { name?: string; avatar_url?: string } | null;
      const user = inv.user as { name?: string; avatar_url?: string } | null;

      return {
        id: inv.id as string,
        group_id: inv.group_id as string,
        user_id: inv.user_id as string | undefined,
        email: inv.email as string | undefined,
        token: inv.token as string | undefined,
        role: inv.role as string,
        message: inv.message as string | undefined,
        status: inv.status as string,
        invited_by: inv.invited_by as string,
        inviter_name: inviter?.name,
        inviter_avatar_url: inviter?.avatar_url,
        user_name: user?.name,
        user_avatar_url: user?.avatar_url,
        expires_at: inv.expires_at as string,
        created_at: inv.created_at as string,
        responded_at: inv.responded_at as string | undefined,
      };
    });

    return {
      success: true,
      invitations,
      total: count || 0,
    };
  } catch (error) {
    logger.error('Exception getting group invitations', error, 'Groups');
    return { success: false, error: 'Failed to get invitations' };
  }
}

/**
 * Get invitation details by token (public, for join links)
 */
export async function getInvitationByToken(
  token: string
): Promise<{
  success: boolean;
  invitation?: {
    id: string;
    group_id: string;
    group_name: string;
    group_slug: string;
    group_description?: string;
    group_avatar_url?: string;
    group_member_count: number;
    role: string;
    inviter_name?: string;
    expires_at: string;
    is_expired: boolean;
  };
  error?: string;
}> {
  try {
    const { data, error } = await (supabase
      .from('group_invitations') as any)
      .select(
        `
        id,
        role,
        expires_at,
        groups!inner (
          id,
          name,
          slug,
          description,
          avatar_url
        ),
        inviter:profiles!group_invitations_invited_by_fkey (
          name
        )
      `
      )
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid invitation link' };
    }

    const group = data.groups as unknown as {
      id: string;
      name: string;
      slug: string;
      description?: string;
      avatar_url?: string;
    };
    const inviter = data.inviter as { name?: string } | null;

    // Get member count
    const { count: memberCount } = await (supabase
      .from('group_members') as any)
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id);

    const isExpired = new Date(data.expires_at) < new Date();

    return {
      success: true,
      invitation: {
        id: data.id,
        group_id: group.id,
        group_name: group.name,
        group_slug: group.slug,
        group_description: group.description,
        group_avatar_url: group.avatar_url,
        group_member_count: memberCount || 0,
        role: data.role,
        inviter_name: inviter?.name,
        expires_at: data.expires_at,
        is_expired: isExpired,
      },
    };
  } catch (error) {
    logger.error('Exception getting invitation by token', error, 'Groups');
    return { success: false, error: 'Failed to get invitation' };
  }
}
