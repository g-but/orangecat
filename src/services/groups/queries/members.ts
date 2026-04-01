/**
 * Groups Member Query Functions
 *
 * Handles member/stakeholder queries for groups.
 * Unified for both circles and organizations.
 *
 * Created: 2025-01-30
 * Last Modified: 2026-03-31
 * Last Modified Summary: Consolidate as-any casts into db-helpers
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type { GroupMembersResponse, GroupMemberDetail } from '../types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, TABLES } from '../constants';
import { checkGroupPermission } from '../permissions';
import { getCurrentUserId } from '../utils/helpers';
import { fromTable, type AnySupabaseClient } from '../db-helpers';

interface MemberRow {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  invited_by: string | null;
  permission_overrides: Record<string, unknown> | null;
  profiles: {
    id: string;
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Get group members/stakeholders
 */
export async function getGroupMembers(
  groupId: string,
  pagination?: { page?: number; pageSize?: number },
  client?: AnySupabaseClient
): Promise<GroupMembersResponse> {
  try {
    const sb = client || supabase;
    const userId = await getCurrentUserId(sb);

    // Check if user can view members
    if (userId) {
      const canView = await checkGroupPermission(groupId, userId, 'canView', sb);
      if (!canView) {
        return { success: false, error: 'Cannot view group members' };
      }
    } else {
      // Check if group is public
      const { data: groupData } = await fromTable(sb, TABLES.groups)
        .select('is_public')
        .eq('id', groupId)
        .single();

      const group = groupData as { is_public: boolean } | null;

      if (!group?.is_public) {
        return { success: false, error: 'Cannot view group members' };
      }
    }

    // Build query
    let query = fromTable(sb, TABLES.group_members)
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
    const rows = (data || []) as MemberRow[];
    const members: GroupMemberDetail[] = rows.map(member => ({
      id: member.id,
      group_id: member.group_id,
      user_id: member.user_id,
      role: member.role,
      role_type: member.role, // Map role to role_type for compatibility
      status: 'active',
      joined_at: member.joined_at,
      invited_by: member.invited_by || null,
      voting_weight: 1.0, // group_members doesn't have voting_weight, use default
      equity_percentage: null, // group_members doesn't have equity_percentage
      permissions: member.permission_overrides || null,
      username: member.profiles?.username || null,
      display_name: member.profiles?.name || null,
      avatar_url: member.profiles?.avatar_url || null,
    }));

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
  memberId: string,
  client?: AnySupabaseClient
): Promise<{ success: boolean; member?: GroupMemberDetail; error?: string }> {
  try {
    const sb = client || supabase;
    const userId = await getCurrentUserId(sb);

    // Check permissions
    if (userId) {
      const canView = await checkGroupPermission(groupId, userId, 'canView', sb);
      if (!canView) {
        return { success: false, error: 'Cannot view group members' };
      }
    }

    const { data, error } = await fromTable(sb, TABLES.group_members)
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

    const row = data as MemberRow;

    const member: GroupMemberDetail = {
      id: row.id,
      group_id: row.group_id,
      user_id: row.user_id,
      role: row.role,
      role_type: row.role, // Map role to role_type for compatibility
      status: 'active',
      joined_at: row.joined_at,
      invited_by: row.invited_by || null,
      voting_weight: 1.0, // group_members doesn't have voting_weight, use default
      equity_percentage: null, // group_members doesn't have equity_percentage
      permissions: row.permission_overrides || null,
      username: row.profiles?.username || null,
      display_name: row.profiles?.name || null,
      avatar_url: row.profiles?.avatar_url || null,
    };

    return { success: true, member };
  } catch (error) {
    logger.error('Exception getting group member', error, 'Groups');
    return { success: false, error: 'Failed to get group member' };
  }
}
