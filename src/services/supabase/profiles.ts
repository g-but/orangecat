'use client'

import getSupabaseClient from './client'
import type { Profile, ProfileFormData } from '@/types/database'
import { logProfile, logger } from '@/utils/logger'

export async function getProfiles() {
  const supabase = getSupabaseClient()
  return supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function getProfile(userId: string): Promise<{ data: Profile | null; error: string | null }> {
  try {
    logProfile(`ProfileHelper: Getting profile for user ${userId}`);

    if (!userId) {
      return { data: null, error: 'User ID is required' };
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        logProfile('ProfileHelper: Profile not found');
        return { data: null, error: null }; // Not found is not an error
      }
      logger.error('ProfileHelper: Error fetching profile:', { error }, 'Profile');
      return { data: null, error: error.message };
    }

    // Map database schema to application schema
    const profile: Profile = {
      id: data.id,
      username: data.username,
      display_name: data.display_name,
      bio: data.bio,
      avatar_url: data.avatar_url,
      banner_url: data.banner_url,
      website: data.website,
      bitcoin_address: data.bitcoin_address,
      lightning_address: data.lightning_address,
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    logProfile('ProfileHelper: Profile fetched successfully');
    return { data: profile, error: null };

  } catch (error) {
    logger.error('ProfileHelper: Unexpected error:', { error }, 'Profile');
    return { data: null, error: 'Failed to fetch profile' };
  }
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
    const supabase = getSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logger.error('ProfileHelper: No authenticated user:', { error: userError }, 'Profile');
      return { data: null, error: 'Authentication required' };
    }

    if (user.id !== userId) {
      logger.error('ProfileHelper: User ID mismatch', { userId, authenticatedUserId: user.id }, 'Profile');
      return { data: null, error: 'Permission denied' };
    }

    // Prepare the profile data for creation with ACTUAL database schema
    const profileData = {
      id: userId,
      username: formData.username?.trim() || null,
      display_name: formData.display_name?.trim() || null, // Use actual display_name column
      bio: formData.bio?.trim() || null,
      avatar_url: formData.avatar_url || null,
      banner_url: formData.banner_url || null,
      website: formData.website?.trim() || null,
      bitcoin_address: formData.bitcoin_address?.trim() || null,
      lightning_address: formData.lightning_address?.trim() || null,
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
      
      if (result.error.code === '23505') {
        return { data: null, error: 'Username is already taken. Please choose another username.' };
      }
      
      return { data: null, error: result.error.message || 'Failed to create profile' };
    }

    // Map database result back to application schema
    const profile: Profile = {
      id: result.data.id,
      username: result.data.username,
      display_name: result.data.display_name,
      bio: result.data.bio,
      avatar_url: result.data.avatar_url,
      banner_url: result.data.banner_url,
      website: result.data.website,
      bitcoin_address: result.data.bitcoin_address,
      lightning_address: result.data.lightning_address,
      created_at: result.data.created_at,
      updated_at: result.data.updated_at
    };

    logProfile('ProfileHelper: Profile created successfully');
    return { data: profile, error: null };

  } catch (error) {
    logger.error('ProfileHelper: Unexpected error during creation:', { error }, 'Profile');
    return { data: null, error: 'Failed to create profile' };
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
    const supabase = getSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logger.error('ProfileHelper: No authenticated user:', { error: userError }, 'Profile');
      return { data: null, error: 'Authentication required' };
    }

    if (user.id !== userId) {
      logger.error('ProfileHelper: User ID mismatch', { userId, authenticatedUserId: user.id }, 'Profile');
      return { data: null, error: 'Permission denied' };
    }

    // Prepare the profile data for update with ACTUAL database schema
    const profileData: Record<string, any> = {
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

    if (formData.website !== undefined) {
      profileData.website = formData.website?.trim() || null;
    }

    if (formData.bitcoin_address !== undefined) {
      profileData.bitcoin_address = formData.bitcoin_address?.trim() || null;
    }

    if (formData.lightning_address !== undefined) {
      profileData.lightning_address = formData.lightning_address?.trim() || null;
    }

    logProfile('ProfileHelper: Prepared update data:', profileData);

    // Check if profile exists first
    const checkClient = getSupabaseClient()
    const { data: existingProfile, error: fetchError } = await checkClient
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
        website: profileData.website,
        bitcoin_address: profileData.bitcoin_address,
        lightning_address: profileData.lightning_address,
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

    // Map database result back to application schema
    const profile: Profile = {
      id: result.data.id,
      username: result.data.username,
      display_name: result.data.display_name,
      bio: result.data.bio,
      avatar_url: result.data.avatar_url,
      banner_url: result.data.banner_url,
      website: result.data.website,
      bitcoin_address: result.data.bitcoin_address,
      lightning_address: result.data.lightning_address,
      created_at: result.data.created_at,
      updated_at: result.data.updated_at
    };

    logProfile('ProfileHelper: Profile operation successful');
    return { data: profile, error: null };

  } catch (error) {
    logger.error('ProfileHelper: Unexpected error during update:', { error }, 'Profile');
    return { data: null, error: 'Failed to update profile' };
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

    const supabase = getSupabaseClient()
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

    const supabase = getSupabaseClient()
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
    
    const supabase = getSupabaseClient()
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

/**
 * Delete a user's profile
 */
export async function deleteProfile(userId: string): Promise<{ error: string | null }> {
  try {
    logProfile(`ProfileHelper: Deleting profile for user ${userId}`);

    if (!userId) {
      return { error: 'User ID is required' };
    }

    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      logger.error('ProfileHelper: Error deleting profile:', { error }, 'Profile');
      return { error: error.message || 'Failed to delete profile' };
    }

    logProfile('ProfileHelper: Profile deleted successfully');
    return { error: null };

  } catch (error) {
    logger.error('ProfileHelper: Unexpected error during deletion:', { error }, 'Profile');
    return { error: 'Failed to delete profile' };
  }
} 
