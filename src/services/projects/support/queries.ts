/**
 * Project Support Queries
 *
 * Database queries for project support read operations.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created project support query functions
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import type {
  ProjectSupportWithUser,
  ProjectSupportStats,
  SupportFilters,
  SupportPagination,
  ProjectSupportResponse,
} from './types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants';

/**
 * Get support stats for a project
 */
export async function getProjectSupportStats(
  projectId: string
): Promise<{ success: boolean; stats?: ProjectSupportStats; error?: string }> {
  try {
    const { data, error } = await supabase
      .from(DATABASE_TABLES.PROJECT_SUPPORT_STATS)
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No stats found, return defaults
        return {
          success: true,
          stats: {
            project_id: projectId,
            total_bitcoin_sats: 0,
            total_signatures: 0,
            total_messages: 0,
            total_reactions: 0,
            total_supporters: 0,
            last_support_at: null,
            updated_at: new Date().toISOString(),
          },
        };
      }
      logger.error('Failed to get project support stats', error, 'ProjectSupport');
      return { success: false, error: 'Failed to fetch support stats' };
    }

    return { success: true, stats: data as ProjectSupportStats };
  } catch (error) {
    logger.error('Error getting project support stats', error, 'ProjectSupport');
    return { success: false, error: 'Internal error' };
  }
}

/**
 * Get project support list with filters and pagination
 */
export async function getProjectSupport(
  projectId: string,
  filters?: SupportFilters,
  pagination?: SupportPagination
): Promise<ProjectSupportResponse> {
  try {
    const limit = Math.min(pagination?.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = pagination?.offset || (pagination?.page ? (pagination.page - 1) * limit : 0);

    let query = supabase
      .from(DATABASE_TABLES.PROJECT_SUPPORT)
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
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters?.support_type) {
      query = query.eq('support_type', filters.support_type);
    }

    if (filters?.is_anonymous !== undefined) {
      query = query.eq('is_anonymous', filters.is_anonymous);
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to get project support', error, 'ProjectSupport');
      return {
        supports: [],
        stats: {
          project_id: projectId,
          total_bitcoin_sats: 0,
          total_signatures: 0,
          total_messages: 0,
          total_reactions: 0,
          total_supporters: 0,
          last_support_at: null,
          updated_at: new Date().toISOString(),
        },
      };
    }

    // Transform data to include user profile
    const supports: ProjectSupportWithUser[] = (data || []).map((item: any) => ({
      ...item,
      user: item.profiles
        ? {
            id: item.profiles.id,
            username: item.profiles.username,
            name: item.profiles.name,
            avatar_url: item.profiles.avatar_url,
          }
        : null,
    }));

    // Get stats
    const statsResult = await getProjectSupportStats(projectId);
    const stats = statsResult.stats || {
      project_id: projectId,
      total_bitcoin_sats: 0,
      total_signatures: 0,
      total_messages: 0,
      total_reactions: 0,
      total_supporters: 0,
      last_support_at: null,
      updated_at: new Date().toISOString(),
    };

    return {
      supports,
      stats,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: count || 0,
        has_more: (count || 0) > offset + limit,
      },
    };
  } catch (error) {
    logger.error('Error getting project support', error, 'ProjectSupport');
    return {
      supports: [],
      stats: {
        project_id: projectId,
        total_bitcoin_sats: 0,
        total_signatures: 0,
        total_messages: 0,
        total_reactions: 0,
        total_supporters: 0,
        last_support_at: null,
        updated_at: new Date().toISOString(),
      },
    };
  }
}

/**
 * Check if user has already supported a project with a specific type
 */
export async function hasUserSupported(
  projectId: string,
  userId: string,
  supportType?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from(DATABASE_TABLES.PROJECT_SUPPORT)
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .limit(1);

    if (supportType) {
      query = query.eq('support_type', supportType);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to check user support', error, 'ProjectSupport');
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    logger.error('Error checking user support', error, 'ProjectSupport');
    return false;
  }
}
