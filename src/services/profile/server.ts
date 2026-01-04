/**
 * PROFILE SERVER SERVICE - Server-side profile operations for API routes
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created server-side profile service to eliminate direct database access in API routes
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Server-side profile service functions
 * Accepts a Supabase client to work in API routes
 */
export class ProfileServerService {
  /**
   * Get profile by user ID
   */
  static async getProfile(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<{ data: ProfileRow | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: null }; // Not found
        }
        logger.error('ProfileServerService.getProfile error', error, 'ProfileServer');
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (err) {
      logger.error('ProfileServerService.getProfile unexpected error', err, 'ProfileServer');
      return { data: null, error: err as Error };
    }
  }

  /**
   * Check if username is available
   */
  static async checkUsernameAvailability(
    supabase: SupabaseClient<Database>,
    username: string,
    excludeUserId?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim());

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data } = await query.single();

      return !data; // true if available (no data found)
    } catch (err) {
      // If error is "no rows", username is available
      if (err instanceof Error && err.message.includes('No rows')) {
        return true;
      }
      logger.error('ProfileServerService.checkUsernameAvailability error', err, 'ProfileServer');
      return false; // Err on the side of caution
    }
  }

  /**
   * Create a new profile
   */
  static async createProfile(
    supabase: SupabaseClient<Database>,
    profileData: ProfileInsert
  ): Promise<{ data: ProfileRow | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        logger.error('ProfileServerService.createProfile error', error, 'ProfileServer');
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (err) {
      logger.error('ProfileServerService.createProfile unexpected error', err, 'ProfileServer');
      return { data: null, error: err as Error };
    }
  }

  /**
   * Ensure profile exists, creating it if it doesn't
   */
  static async ensureProfile(
    supabase: SupabaseClient<Database>,
    userId: string,
    userEmail?: string | null,
    userMetadata?: Record<string, any> | null
  ): Promise<{ data: ProfileRow | null; error: Error | null }> {
    try {
      // Check if profile exists
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        logger.error('ProfileServerService.ensureProfile check error', checkError, 'ProfileServer');
        return { data: null, error: checkError as Error };
      }

      if (existing) {
        // Profile exists, fetch full profile
        return this.getProfile(supabase, userId);
      }

      // Profile doesn't exist, create it
      const safeEmail = typeof userEmail === 'string' ? userEmail : null;
      const emailName = safeEmail && safeEmail.includes('@') ? safeEmail.split('@')[0] : null;
      const username =
        emailName && emailName.length > 0 ? emailName : `user_${String(userId).slice(0, 8)}`;
      const name =
        (userMetadata?.full_name as string | undefined) ||
        (userMetadata?.name as string | undefined) ||
        (userMetadata?.display_name as string | undefined) ||
        (emailName && emailName.length > 0 ? emailName : null) ||
        'User';

      const profileData: ProfileInsert = {
        id: userId,
        username,
        name,
        email: safeEmail,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return this.createProfile(supabase, profileData);
    } catch (err) {
      logger.error('ProfileServerService.ensureProfile unexpected error', err, 'ProfileServer');
      return { data: null, error: err as Error };
    }
  }

  /**
   * Get project count for a user
   */
  static async getProjectCount(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        logger.error('ProfileServerService.getProjectCount error', error, 'ProfileServer');
        return 0;
      }

      return count || 0;
    } catch (err) {
      logger.error('ProfileServerService.getProjectCount unexpected error', err, 'ProfileServer');
      return 0;
    }
  }
}
