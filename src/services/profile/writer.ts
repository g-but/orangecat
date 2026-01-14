/**
 * PROFILE WRITER MODULE
 *
 * Created: 2025-01-09
 * Last Modified: 2025-10-23
 * Last Modified Summary: Enhanced with username uniqueness check and proper error handling
 */

import supabase from '@/lib/supabase/browser'
import { logger, logProfile } from '@/utils/logger'
import { ProfileMapper } from './mapper'
import { ProfileReader } from './reader'
import type { ScalableProfile, ScalableProfileFormData, ProfileAnalytics, ProfileServiceResponse } from './types'
import { DATABASE_TABLES } from '@/config/database-tables'

// =====================================================================
// ✏️ PROFILE WRITE OPERATIONS
// =====================================================================

export class ProfileWriter {

  /**
   * Check if username is available (not taken by another user)
   */
  static async checkUsernameUniqueness(
    username: string,
    currentUserId: string
  ): Promise<boolean> {
    if (!username?.trim()) {
      return true; // Empty username is always "available" (will be handled by validation)
    }

    try {
      const { data } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('id')
        .eq('username', username.trim())
        .neq('id', currentUserId)
        .single();

      return !data; // true if no other user has this username
    } catch (error) {
      logger.error('ProfileWriter.checkUsernameUniqueness error:', error);
      return false; // Err on the side of caution
    }
  }

  /**
   * Update profile with comprehensive field support
   * Includes username uniqueness check and proper error handling
   */
  static async updateProfile(
    userId: string,
    formData: ScalableProfileFormData
  ): Promise<ProfileServiceResponse<ScalableProfile>> {
    if (!userId?.trim()) {
      return { success: false, error: 'User ID is required' }
    }

    try {
      logProfile('updateProfile', { userId, formData })

      // Check username uniqueness if username is being updated
      if (formData.username) {
        const isAvailable = await this.checkUsernameUniqueness(
          formData.username,
          userId
        );

        if (!isAvailable) {
          return {
            success: false,
            error: 'Username is already taken'
          };
        }
      }

      // Prepare update data
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      // Update in database
      const { data, error } = await (supabase
        .from(DATABASE_TABLES.PROFILES) as any)
        .update(updateData)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        logger.error('ProfileWriter.updateProfile database error:', error);

        // Handle specific errors
        if (error.code === '23505') {
          return { success: false, error: 'Username is already taken' };
        }

        return {
          success: false,
          error: 'Failed to update profile. Please try again.'
        };
      }

      const updatedProfile = ProfileMapper.mapDatabaseToProfile(data);
      logProfile('updateProfile success', { userId, profile: updatedProfile });

      return { success: true, data: updatedProfile ?? undefined };

    } catch (err) {
      logger.error('ProfileWriter.updateProfile unexpected error:', err);
      return {
        success: false,
        error: 'An unexpected error occurred while updating profile. Please check your connection and try again.'
      };
    }
  }

  /**
   * Create a new profile
   */
  static async createProfile(
    userId: string,
    formData: ScalableProfileFormData
  ): Promise<ProfileServiceResponse<ScalableProfile>> {
    if (!userId?.trim()) {
      return { success: false, error: 'User ID is required' }
    }

    try {
      logProfile('createProfile', { userId, formData })

      // Prepare profile data
      const profileData: Partial<ScalableProfile> = {
        id: userId,
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        status: 'active',
        onboarding_completed: false,
        following_count: 0,
        project_count: 0,
        total_raised: 0,
        total_donated: 0
      }

      // Map to database format
      const insertData = ProfileMapper.mapProfileToDatabase(profileData);
      insertData.id = userId; // Ensure ID is set

      const { data, error } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .insert(insertData)
        .select('*')
        .single()

      if (error) {
        logger.error('ProfileWriter.createProfile database error:', error)
        
        if (error.code === '23505') {
          return { success: false, error: 'Profile already exists or username is taken' }
        }
        
        return { success: false, error: 'Failed to create profile. Please try again.' }
      }

      const newProfile = ProfileMapper.mapDatabaseToProfile(data);
      logProfile('createProfile success', { userId, profile: newProfile })

      return { success: true, data: newProfile ?? undefined }

    } catch (err) {
      logger.error('ProfileWriter.createProfile unexpected error:', err)
      return { success: false, error: 'An unexpected error occurred while creating profile' }
    }
  }

  /**
   * Update profile analytics
   */
  static async updateAnalytics(
    userId: string,
    analytics: ProfileAnalytics
  ): Promise<ProfileServiceResponse<void>> {
    if (!userId?.trim()) {
      return { success: false, error: 'User ID is required' }
    }

    try {
      // Get current profile
      const currentProfile = await ProfileReader.getProfile(userId);
      if (!currentProfile) {
        return { success: false, error: 'Profile not found' }
      }

      // Merge analytics
      const updatedProfile: Partial<ScalableProfile> = {
        ...currentProfile,
        ...analytics,
        updated_at: new Date().toISOString()
      }

      // Map to database format
      const updateData = ProfileMapper.mapProfileToDatabase(updatedProfile);

      const { error } = await (supabase
        .from(DATABASE_TABLES.PROFILES) as any)
        .update(updateData)
        .eq('id', userId)

      if (error) {
        logger.error('ProfileWriter.updateAnalytics error:', error)
        return { success: false, error: 'Failed to update analytics' }
      }

      return { success: true }

    } catch (err) {
      logger.error('ProfileWriter.updateAnalytics unexpected error:', err)
      return { success: false, error: 'An unexpected error occurred while updating analytics' }
    }
  }

  /**
   * Delete profile
   */
  static async deleteProfile(userId: string): Promise<ProfileServiceResponse<void>> {
    if (!userId?.trim()) {
      return { success: false, error: 'User ID is required' }
    }

    try {
      // Verify authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Authentication required' }
      }

      if (user.id !== userId) {
        return { success: false, error: 'Permission denied: Can only delete your own profile' }
      }

      logProfile('deleteProfile', { userId })

      const { error } = await (supabase
        .from(DATABASE_TABLES.PROFILES) as any)
        .delete()
        .eq('id', userId)

      if (error) {
        logger.error('ProfileWriter.deleteProfile error:', error)
        return { success: false, error: 'Failed to delete profile' }
      }

      logProfile('deleteProfile success', { userId })
      return { success: true }

    } catch (err) {
      logger.error('ProfileWriter.deleteProfile unexpected error:', err)
      return { success: false, error: 'An unexpected error occurred while deleting profile' }
    }
  }

  /**
   * Fallback profile update (direct database update)
   */
  static async fallbackUpdate(
    userId: string,
    updates: Record<string, any>
  ): Promise<ProfileServiceResponse<any>> {
    if (!userId?.trim()) {
      return { success: false, error: 'User ID is required' }
    }

    try {
      // Prefer Postgres function for atomic profile update when available
      const { data, error } = await (supabase.rpc as any)('update_profile', {
        profile_data: updates
      })

      if (error) {
        logger.error('ProfileWriter.fallbackUpdate error:', error)
        return { success: false, error: 'All profile update methods failed: ' + error.message }
      }

      return { success: true, data }

    } catch (err) {
      logger.error('ProfileWriter.fallbackUpdate unexpected error:', err)
      return { success: false, error: 'An unexpected error occurred during fallback update' }
    }
  }
} 
