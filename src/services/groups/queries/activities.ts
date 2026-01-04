/**
 * Groups Activity Query Functions
 *
 * Handles activity tracking queries for groups.
 * Unified for both circles and organizations.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created unified activity queries
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type { GroupActivitiesResponse, GroupActivitiesQuery } from '../types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, TABLES } from '../constants';
import { checkGroupPermission } from '../permissions';
import { getCurrentUserId } from '../utils/helpers';

/**
 * Get group activities
 */
export async function getGroupActivities(
  groupId: string,
  query?: GroupActivitiesQuery,
  pagination?: { page?: number; pageSize?: number }
): Promise<GroupActivitiesResponse> {
  try {
    const userId = await getCurrentUserId();

    // Check permissions
    if (userId) {
      const canView = await checkGroupPermission(groupId, userId, 'canView');
      if (!canView) {
        return { success: false, error: 'Cannot view group activities' };
      }
    } else {
      // Check if group is public
      const { data: group } = await supabase
        .from(TABLES.groups)
        .select('is_public')
        .eq('id', groupId)
        .single();

      if (!group?.is_public) {
        return { success: false, error: 'Cannot view group activities' };
      }
    }

    // Check if group_activities table exists, otherwise return empty
    // Note: group_activities table may not exist yet - this is a placeholder
    // TODO: Create group_activities table or use alternative activity tracking
    // Note: group_activities table may not exist - check if it does
    // For now, return empty result if table doesn't exist
    let dbQuery = supabase
      .from('group_activities')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId);

    // Apply filters
    if (query?.activity_type) {
      dbQuery = dbQuery.eq('activity_type', query.activity_type);
    }
    if (query?.user_id) {
      dbQuery = dbQuery.eq('user_id', query.user_id);
    }
    if (query?.from_date) {
      dbQuery = dbQuery.gte('created_at', query.from_date);
    }
    if (query?.to_date) {
      dbQuery = dbQuery.lte('created_at', query.to_date);
    }

    // Apply sorting
    const sortBy = query?.sort_by || 'created_at';
    const sortOrder = query?.sort_order || 'desc';
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const pageSize = Math.min(pagination?.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const page = pagination?.page || 1;
    const offset = (page - 1) * pageSize;

    dbQuery = dbQuery.range(offset, offset + pageSize - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to get group activities', error, 'Groups');
      return { success: false, error: error.message };
    }

    return { success: true, activities: data || [], total: count || 0 };
  } catch (error) {
    logger.error('Exception getting group activities', error, 'Groups');
    return { success: false, error: 'Failed to get group activities' };
  }
}

