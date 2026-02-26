/**
 * Groups Query Functions
 *
 * Handles all database queries for group read operations.
 * Unified for both circles and organizations.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created unified group queries
 */

import supabase from '@/lib/supabase/browser';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import type { Group, GroupsQuery, GroupsListResponse, GroupResponse } from '../types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, TABLES } from '../constants';
import { getCurrentUserId, getUserGroupIds } from '../utils/helpers';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

/**
 * Get a specific group by slug
 * Convenience wrapper around getGroup
 */
export async function getGroupBySlug(
  slug: string,
  client?: AnySupabaseClient
): Promise<GroupResponse> {
  return getGroup(slug, true, client);
}

/**
 * Get a specific group by ID or slug
 */
export async function getGroup(
  identifier: string,
  bySlug: boolean = false,
  client?: AnySupabaseClient
): Promise<GroupResponse> {
  try {
    const sb = client || supabase;
    const userId = await getCurrentUserId(sb);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (sb.from(TABLES.groups) as any).select('*');

    if (bySlug) {
      query = query.eq('slug', identifier);
    } else {
      query = query.eq('id', identifier);
    }

    // If user is not authenticated, only show public groups
    if (!userId) {
      query = query.eq('is_public', true);
    } else {
      // Show public groups or groups the user is a member of
      const userGroupIds = await getUserGroupIds(userId, sb);
      if (userGroupIds.length > 0) {
        query = query.or(`is_public.eq.true,id.in.(${userGroupIds.join(',')})`);
      } else {
        query = query.eq('is_public', true);
      }
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      logger.error('Failed to get group', error, 'Groups');
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Group not found' };
    }

    return { success: true, group: data as Group };
  } catch (error) {
    logger.error('Exception getting group', error, 'Groups');
    return { success: false, error: 'Failed to get group' };
  }
}

/**
 * Get groups for current user
 */
export async function getUserGroups(
  query?: GroupsQuery,
  pagination?: { page?: number; pageSize?: number },
  client?: AnySupabaseClient
): Promise<GroupsListResponse> {
  try {
    const sb = client || supabase;
    const userId = await getCurrentUserId(sb);
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Get user's group IDs from group_members
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: memberships } = await (sb.from(DATABASE_TABLES.GROUP_MEMBERS) as any)
      .select('group_id')
      .eq('user_id', userId);

    if (!memberships || memberships.length === 0) {
      return { success: true, groups: [], total: 0 };
    }

    const groupIds = memberships.map((m: { group_id: string }) => m.group_id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbQuery = (sb.from(TABLES.groups) as any)
      .select('*', { count: 'exact' })
      .in('id', groupIds);

    // Apply filters
    if (query?.type) {
      dbQuery = dbQuery.eq('type', query.type);
    }
    if (query?.governance_model) {
      dbQuery = dbQuery.eq('governance_model', query.governance_model);
    }
    if (query?.category) {
      dbQuery = dbQuery.eq('category', query.category);
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
      logger.error('Failed to get user groups', error, 'Groups');
      return { success: false, error: error.message };
    }

    return { success: true, groups: (data || []) as Group[], total: count || 0 };
  } catch (error) {
    logger.error('Exception getting user groups', error, 'Groups');
    return { success: false, error: 'Failed to get groups' };
  }
}

/**
 * Get available groups for discovery (public groups)
 */
export async function getAvailableGroups(
  query?: GroupsQuery,
  pagination?: { page?: number; pageSize?: number },
  client?: AnySupabaseClient
): Promise<GroupsListResponse> {
  try {
    const sb = client || supabase;
    const _userId = await getCurrentUserId(sb);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbQuery = (sb.from(TABLES.groups) as any)
      .select('*', { count: 'exact' })
      .eq('is_public', true);

    // Apply filters
    if (query?.type) {
      // Map legacy type to label
      const typeToLabel: Record<string, string> = {
        circle: 'circle',
        community: 'network_state',
        collective: 'cooperative',
        dao: 'dao',
        company: 'company',
        nonprofit: 'nonprofit',
        foundation: 'nonprofit',
        guild: 'guild',
      };
      const label = typeToLabel[query.type] || query.type;
      dbQuery = dbQuery.eq('label', label);
    }
    if (query?.governance_model) {
      // Map legacy governance_model to governance_preset
      const modelToPreset: Record<string, string> = {
        consensus: 'consensus',
        flat: 'consensus',
        democratic: 'democratic',
        hierarchical: 'hierarchical',
        liquid_democracy: 'democratic',
        quadratic_voting: 'democratic',
        stake_weighted: 'democratic',
        reputation_based: 'democratic',
      };
      const preset = modelToPreset[query.governance_model] || query.governance_model;
      dbQuery = dbQuery.eq('governance_preset', preset);
    }
    if (query?.category) {
      // Category is now in tags array
      dbQuery = dbQuery.contains('tags', [query.category]);
    }
    if (query?.visibility) {
      dbQuery = dbQuery.eq('visibility', query.visibility);
    }
    if (query?.member_count_min) {
      dbQuery = dbQuery.gte('member_count', query.member_count_min);
    }
    if (query?.member_count_max) {
      dbQuery = dbQuery.lte('member_count', query.member_count_max);
    }
    if (query?.has_treasury !== undefined) {
      if (query.has_treasury) {
        dbQuery = dbQuery.not('bitcoin_address', 'is', null);
      } else {
        dbQuery = dbQuery.is('bitcoin_address', null);
      }
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
      logger.error('Failed to get available groups', error, 'Groups');
      return { success: false, error: error.message };
    }

    return { success: true, groups: (data || []) as Group[], total: count || 0 };
  } catch (error) {
    logger.error('Exception getting available groups', error, 'Groups');
    return { success: false, error: 'Failed to get available groups' };
  }
}

/**
 * Search groups by query string
 */
export async function searchGroups(
  searchQuery: string,
  filters?: GroupsQuery,
  pagination?: { page?: number; pageSize?: number },
  client?: AnySupabaseClient
): Promise<GroupsListResponse> {
  try {
    const sb = client || supabase;
    const _userId = await getCurrentUserId(sb);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbQuery = (sb.from(TABLES.groups) as any)
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);

    // Apply filters
    if (filters?.type) {
      // Map legacy type to label
      const typeToLabel: Record<string, string> = {
        circle: 'circle',
        community: 'network_state',
        collective: 'cooperative',
        dao: 'dao',
        company: 'company',
        nonprofit: 'nonprofit',
        foundation: 'nonprofit',
        guild: 'guild',
      };
      const label = typeToLabel[filters.type] || filters.type;
      dbQuery = dbQuery.eq('label', label);
    }
    if (filters?.category) {
      // Category is now in tags array
      dbQuery = dbQuery.contains('tags', [filters.category]);
    }
    if (filters?.is_public !== undefined) {
      dbQuery = dbQuery.eq('is_public', filters.is_public);
    }

    // Apply sorting
    const sortBy = filters?.sort_by || 'created_at';
    const sortOrder = filters?.sort_order || 'desc';
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const pageSize = Math.min(pagination?.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const page = pagination?.page || 1;
    const offset = (page - 1) * pageSize;

    dbQuery = dbQuery.range(offset, offset + pageSize - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to search groups', error, 'Groups');
      return { success: false, error: error.message };
    }

    return { success: true, groups: (data || []) as Group[], total: count || 0 };
  } catch (error) {
    logger.error('Exception searching groups', error, 'Groups');
    return { success: false, error: 'Failed to search groups' };
  }
}
