/**
 * Groups Service Helper Functions
 *
 * Shared utility functions for the groups service.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created helpers file
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { TABLES } from '../constants';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Get current authenticated user ID
 */
export async function getCurrentUserId(client?: SupabaseClient<Database>): Promise<string | null> {
  try {
    const supabaseClient = client || supabase;
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    return user?.id || null;
  } catch (error) {
    logger.error('Error getting current user ID', error, 'Groups');
    return null;
  }
}

/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending number if needed
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  excludeId?: string,
  client?: SupabaseClient<Database>
): Promise<string> {
  const supabaseClient = client || supabase;
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data } = await supabaseClient
      .from(TABLES.groups)
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!data || (excludeId && data.id === excludeId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Get user's group IDs for permission checks
 */
export async function getUserGroupIds(userId: string): Promise<string[]> {
  try {
    const { data } = await supabase
      .from(TABLES.group_members)
      .select('group_id')
      .eq('user_id', userId);

    return data?.map((m) => m.group_id) || [];
  } catch (error) {
    logger.error('Error getting user group IDs', error, 'Groups');
    return [];
  }
}

/**
 * Check if a user is a member of a group
 */
export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from(TABLES.group_members)
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    return !!data;
  } catch (error) {
    logger.error('Error checking group membership', error, 'Groups');
    return false;
  }
}

/**
 * Get user's role in a group
 */
export async function getUserRole(
  groupId: string,
  userId: string
): Promise<'founder' | 'admin' | 'member' | null> {
  try {
    const { data } = await supabase
      .from(TABLES.group_members)
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    return (data?.role as 'founder' | 'admin' | 'member') || null;
  } catch (error) {
    logger.error('Error getting user role', error, 'Groups');
    return null;
  }
}

