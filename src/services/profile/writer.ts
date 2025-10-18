/**
 * PROFILE WRITER MODULE
 * 
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Extracted from profileService.ts for modular architecture - handles write operations
 */

import { logger, logProfile } from '@/utils/logger'
import { ClientProfileService, type ClientProfileUpdateData } from './clientProfileService'
import type { ScalableProfile, ScalableProfileFormData, ProfileAnalytics, ProfileServiceResponse } from './types'

// =====================================================================
// ✏️ PROFILE WRITE OPERATIONS
// =====================================================================

export class ProfileWriter {
  
  /**
   * Update profile with comprehensive field support
   * Uses the unified profile service for clean, consistent operations
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

      // Convert ScalableProfileFormData to ClientProfileUpdateData
      const updateData: ClientProfileUpdateData = {
        display_name: formData.display_name,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        banner_url: formData.banner_url,
        website: formData.website,
        bitcoin_address: formData.bitcoin_address,
        lightning_address: formData.lightning_address
      }

      // Use the client service
      const result = await ClientProfileService.updateProfile(userId, updateData)

      if (!result.success) {
        logger.error('ProfileWriter.updateProfile error:', result.error)
        return {
          success: false,
          error: result.error || 'Failed to update profile. Please try again.'
        }
      }

      // Convert Profile to ScalableProfile format
      const updatedProfile: ScalableProfile = {
        id: result.data!.id,
        username: result.data!.username,
        display_name: result.data!.display_name,
        bio: result.data!.bio,
        avatar_url: result.data!.avatar_url,
        banner_url: result.data!.banner_url,
        website: result.data!.website,
        bitcoin_address: result.data!.bitcoin_address,
        lightning_address: result.data!.lightning_address,
        created_at: result.data!.created_at,
        updated_at: result.data!.updated_at,
        // Default values for ScalableProfile fields
        last_active_at: result.data!.updated_at,
        status: 'active',
        onboarding_completed: true,
        profile_views: 0,
        follower_count: 0,
        following_count: 0,
        campaign_count: 0,
        total_raised: 0,
        total_donated: 0
      }

      logProfile('updateProfile success', { userId, profile: updatedProfile })
      return { success: true, data: updatedProfile }

    } catch (err) {
      logger.error('ProfileWriter.updateProfile unexpected error:', err)
      return {
        success: false,
        error: 'An unexpected error occurred while updating profile. Please check your connection and try again.'
      }
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
        profile_views: 0,
        follower_count: 0,
        following_count: 0,
        campaign_count: 0,
        total_raised: 0,
        total_donated: 0
      }

      // Map to database format
      const insertData = ProfileMapper.mapProfileToDatabase(profileData);
      insertData.id = userId; // Ensure ID is set

      const { data, error } = await supabase
        .from('profiles')
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

      return { success: true, data: newProfile }

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

      const { error } = await supabase
        .from('profiles')
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

      const { error } = await supabase
        .from('profiles')
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
      const { data, error } = await supabase.rpc('update_profile', {
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
