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
 * Create a new user profile in the database
 */
export async function createProfile(userId: string, formData: ProfileFormData): Promise<{ data: Profile | null; error: string | null }> {
  try {
    logProfile(`ProfileHelper: Starting profile creation for user ${userId}`, { data: formData });

    // Validate input
    if (!userId) {
      return { data: null, error: 'User ID is required' };
    }

    // Get current user to ensure they can only create their own profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logger.error('ProfileHelper: No authenticated user:', { error: userError }, 'Profile');
      return { data: null, error: 'Authentication required' };
    }

    if (user.id !== userId) {
      logger.error('ProfileHelper: User ID mismatch', { userId, authenticatedUserId: user.id }, 'Profile');
      return { data: null, error: 'Permission denied' };
    }

    // Prepare the profile data for creation
    const profileData = {
      id: userId,
      username: formData.username?.trim() || null,
      display_name: formData.display_name?.trim() || null,
      bio: formData.bio?.trim() || null,
      avatar_url: formData.avatar_url || null,
      banner_url: formData.banner_url || null,
      bitcoin_address: formData.bitcoin_address?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    logProfile('ProfileHelper: Creating new profile with data:', profileData);

    const result = await supabase
      .from('profiles')
      .insert(profileData)
      .select('*')
      .single();

    if (result.error) {
      logger.error('ProfileHelper: Profile creation failed:', { error: result.error }, 'Profile');
      
      // Handle specific error cases
      if (result.error.code === '23505') {
        return { data: null, error: 'Username is already taken. Please choose another username.' };
      }
      
      return { data: null, error: result.error.message || 'Failed to create profile' };
    }

    if (!result.data) {
      logger.error('ProfileHelper: No data returned from profile creation', undefined, 'Profile');
      return { data: null, error: 'No data returned from create operation' };
    }

    logProfile('ProfileHelper: Profile creation successful!', { data: result });
    return { data: result.data, error: null };

  } catch (error: any) {
    logger.error('ProfileHelper: Unexpected error during profile creation:', error, 'Profile');
    return { data: null, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Update a user's profile in the database
 */
export async function updateProfile(userId: string, formData: ProfileFormData): Promise<{ data: Profile | null; error: string | null }> {
  try {
    logProfile(`ProfileHelper: Starting profile update for user ${userId}`, { data: formData });

    // Validate input
    if (!userId) {
      return { data: null, error: 'User ID is required' };
    }

    // Get current user to ensure they can only update their own profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logger.error('ProfileHelper: No authenticated user:', { error: userError }, 'Profile');
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
      logger.error('ProfileHelper: Error checking existing profile:', { error: fetchError }, 'Profile');
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
      logger.error('ProfileHelper: Database operation failed:', { error: result.error }, 'Profile');
      
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

    logProfile('ProfileHelper: Operation successful!', { data: result });
    return { data: result.data, error: null };

  } catch (error: any) {
    logger.error('ProfileHelper: Unexpected error during profile update:', error, 'Profile');
    return { data: null, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<{ available: boolean; error: string | null }> {
  try {
    if (!username?.trim()) {
      return { available: false, error: 'Username is required' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.trim())
      .limit(1);

    if (error) {
      logger.error('ProfileHelper: Error checking username availability:', { error }, 'Profile');
      return { available: false, error: 'Failed to check username availability' };
    }

    return { available: data.length === 0, error: null };
  } catch (error: any) {
    logger.error('ProfileHelper: Unexpected error checking username:', error, 'Profile');
    return { available: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Get profile by username
 */
export async function getProfileByUsername(username: string): Promise<{ data: Profile | null; error: string | null }> {
  try {
    if (!username?.trim()) {
      return { data: null, error: 'Username is required' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: 'Profile not found' };
      }
      logger.error('ProfileHelper: Error fetching profile by username:', { error }, 'Profile');
      return { data: null, error: 'Failed to fetch profile' };
    }

    return { data, error: null };
  } catch (error: any) {
    logger.error('ProfileHelper: Unexpected error fetching profile by username:', error, 'Profile');
    return { data: null, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Search profiles by username or display name
 */
export async function searchProfiles(query: string): Promise<{ data: Profile[]; error: string | null }> {
  try {
    if (!query?.trim()) {
      return { data: [], error: null };
    }

    const searchTerm = `%${query.trim()}%`;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
      .order('username')
      .limit(20);

    if (error) {
      logger.error('ProfileHelper: Error searching profiles:', { error }, 'Profile');
      return { data: [], error: 'Failed to search profiles' };
    }

    return { data: data || [], error: null };
  } catch (error: any) {
    logger.error('ProfileHelper: Unexpected error searching profiles:', error, 'Profile');
    return { data: [], error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Validate profile data before submission
 */
export function validateProfileData(formData: ProfileFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate username
  if (formData.username !== undefined) {
    const username = formData.username?.trim();
    if (username && username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    if (username && username.length > 20) {
      errors.push('Username must be 20 characters or less');
    }
    if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, hyphens, and underscores');
    }
  }

  // Validate display name
  if (formData.display_name !== undefined) {
    const displayName = formData.display_name?.trim();
    if (displayName && displayName.length > 50) {
      errors.push('Display name must be 50 characters or less');
    }
  }

  // Validate bio
  if (formData.bio !== undefined) {
    const bio = formData.bio?.trim();
    if (bio && bio.length > 500) {
      errors.push('Bio must be 500 characters or less');
    }
  }

  // Validate Bitcoin address format (basic validation)
  if (formData.bitcoin_address !== undefined) {
    const btcAddress = formData.bitcoin_address?.trim();
    if (btcAddress && !/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(btcAddress)) {
      errors.push('Invalid Bitcoin address format');
    }
  }

  return { valid: errors.length === 0, errors };
} 