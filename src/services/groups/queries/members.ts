/**
 * Groups Member Query Functions
 *
 * Handles member/stakeholder queries for groups.
 * Unified for both circles and organizations.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created unified member queries
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type { GroupMembersResponse, GroupMemberDetail } from '../types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, TABLES } from '../constants';
import { checkGroupPermission } from '../permissions';
import { getCurrentUserId } from '../utils/helpers';

/**
 * Get group members/stakeholders
 */
export async function getGroupMembers(
  groupId: string,
  pagination?: { page?: number; pageSize?: number }
): Promise<GroupMembersResponse> {
  try {
    const userId = await getCurrentUserId();

    // Check if user can view members
    if (userId) {
      const canView = await checkGroupPermission(groupId, userId, 'canView');
      if (!canView) {
        return { success: false, error: 'Cannot view group members' };
      }
    } else {
      // Check if group is public
      const { data: groupData } = await (supabase
        .from(TABLES.groups) as any)
        .select('is_public')
        .eq('id', groupId)
        .single();
      const group = groupData as any;

      if (!group?.is_public) {
        return { success: false, error: 'Cannot view group members' };
      }
    }

    // Build query
    let query = (supabase
      .from(TABLES.group_members) as any)
      .select(
        `
        *,
        profiles:user_id (
          id,
          username,
          name,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('group_id', groupId);

    // Apply pagination
    const pageSize = Math.min(pagination?.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const page = pagination?.page || 1;
    const offset = (page - 1) * pageSize;

    query = query.range(offset, offset + pageSize - 1).order('joined_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to get group members', error, 'Groups');
      return { success: false, error: error.message };
    }

    // Transform to GroupMemberDetail format
    const members: GroupMemberDetail[] =
      data?.map((member: any) => ({
        id: member.id,
        group_id: member.group_id,
        user_id: member.user_id,
        role: member.role as any,
        role_type: member.role, // Map role to role_type for compatibility
        status: 'active' as any,
        joined_at: member.joined_at,
        invited_by: member.invited_by || null,
        voting_weight: 1.0, // group_members doesn't have voting_weight, use default
        equity_percentage: null, // group_members doesn't have equity_percentage
        permissions: member.permission_overrides || null,
        username: member.profiles?.username || null,
        display_name: member.profiles?.name || null,
        avatar_url: member.profiles?.avatar_url || null,
      })) || [];

    return { success: true, members, total: count || 0 };
  } catch (error) {
    logger.error('Exception getting group members', error, 'Groups');
    return { success: false, error: 'Failed to get group members' };
  }
}

/**
 * Get a specific member/stakeholder
 */
export async function getGroupMember(
  groupId: string,
  memberId: string
): Promise<{ success: boolean; member?: GroupMemberDetail; error?: string }> {
  try {
    const userId = await getCurrentUserId();

    // Check permissions
    if (userId) {
      const canView = await checkGroupPermission(groupId, userId, 'canView');
      if (!canView) {
        return { success: false, error: 'Cannot view group members' };
      }
    }

    const { data, error } = await (supabase
      .from(TABLES.group_members) as any)
      .select(
        `
        *,
        profiles:user_id (
          id,
          username,
          name,
          avatar_url
        )
      `
      )
      .eq('group_id', groupId)
      .eq('user_id', memberId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get group member', error, 'Groups');
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Member not found' };
    }

    const member: GroupMemberDetail = {
      id: data.id,
      group_id: data.group_id,
      user_id: data.user_id,
      role: data.role as any,
      role_type: data.role, // Map role to role_type for compatibility
      status: 'active' as any,
      joined_at: data.joined_at,
      invited_by: data.invited_by || null,
      voting_weight: 1.0, // group_members doesn't have voting_weight, use default
      equity_percentage: null, // group_members doesn't have equity_percentage
      permissions: data.permission_overrides || null,
      username: data.profiles?.username || null,
      display_name: data.profiles?.name || null,
      avatar_url: data.profiles?.avatar_url || null,
    };

    return { success: true, member };
  } catch (error) {
    logger.error('Exception getting group member', error, 'Groups');
    return { success: false, error: 'Failed to get group member' };
  }
}

