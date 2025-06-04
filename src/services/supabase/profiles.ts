'use client'

import supabase from './client'
import type { Profile, ProfileFormData } from '@/types/database'
import { logProfile, logger } from '@/utils/logger'

export async function getProfiles() {
  return supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function getProfile(id: string) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
}

/**
 * Update a user's profile in the database
 */
export async function updateProfile(userId: string, formData: ProfileFormData): Promise<{ data: Profile | null; error: string | null }> {
  try {
    logProfile(`ProfileHelper: Starting profile update for user ${userId}`, formData);

    // Validate input
    if (!userId) {
      return { data: null, error: 'User ID is required' };
    }

    // Get current user to ensure they can only update their own profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logger.error('ProfileHelper: No authenticated user:', userError, 'Profile');
      return { data: null, error: 'Authentication required' };
    }

    if (user.id !== userId) {
      logger.error('ProfileHelper: User ID mismatch', { userId, authenticatedUserId: user.id }, 'Profile');
      return { data: null, error: 'Permission denied' };
    }

    // Prepare the profile data for update
    const profileData: Partial<Profile> = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are provided and not empty
    if (formData.username !== undefined) {
      profileData.username = formData.username?.trim() || null;
    }

    if (formData.display_name !== undefined) {
      profileData.display_name = formData.display_name?.trim() || null;
    }

    if (formData.bio !== undefined) {
      profileData.bio = formData.bio?.trim() || null;
    }

    if (formData.avatar_url !== undefined) {
      profileData.avatar_url = formData.avatar_url || null;
    }

    if (formData.banner_url !== undefined) {
      profileData.banner_url = formData.banner_url || null;
    }

    if (formData.bitcoin_address !== undefined) {
      profileData.bitcoin_address = formData.bitcoin_address?.trim() || null;
    }

    logProfile('ProfileHelper: Prepared update data:', profileData);

    // Check if profile exists first
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('ProfileHelper: Error checking existing profile:', fetchError, 'Profile');
      return { data: null, error: 'Failed to check existing profile' };
    }

    let result;

    if (!existingProfile) {
      // Profile doesn't exist, create it
      logProfile('ProfileHelper: Profile does not exist, creating new profile');
      
      const newProfileData = {
        id: userId,
        username: profileData.username,
        display_name: profileData.display_name,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
        banner_url: profileData.banner_url,
        bitcoin_address: profileData.bitcoin_address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      result = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select('*')
        .single();
    } else {
      // Profile exists, update it
      logProfile('ProfileHelper: Updating existing profile');
      
      result = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select('*')
        .single();
    }

    if (result.error) {
      logger.error('ProfileHelper: Database operation failed:', result.error, 'Profile');
      
      // Handle specific error cases
      if (result.error.code === '23505') {
        return { data: null, error: 'Username is already taken. Please choose another username.' };
      }
      
      return { data: null, error: result.error.message || 'Failed to update profile' };
    }

    if (!result.data) {
      logger.error('ProfileHelper: No data returned from database operation', undefined, 'Profile');
      return { data: null, error: 'No data returned from update operation' };
    }

    logProfile('ProfileHelper: Operation successful!', result);
    return { data: result.data, error: null };

  } catch (error: any) {
    logger.error('ProfileHelper: Unexpected error during profile update:', error, 'Profile');
    return { data: null, error: error.message || 'An unexpected error occurred' };
  }
} 