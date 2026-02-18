/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SUPABASE PROFILES SERVICE - CLEAN PROFILE OPERATIONS
 *
 * This service handles all profile operations with proper
 * error handling, logging, and type safety.
 *
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Extracted from massive client.ts, pure profile concerns
 */

import { supabase } from '../core/client';
import { logger, logProfile } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import type { Profile, ProfileUpdateData, ProfileResponse, ProfileUpdateResponse } from '../types';
import { isValidProfile } from '../types';

// ==================== PROFILE OPERATIONS ====================

/**
 * Get a user's profile by ID with validation and error handling
 * @param userId - Unique user identifier
 * @returns Promise<ProfileResponse> - Profile data or error
 * @example
 * ```typescript
 * const { data: profile, error } = await getProfile('user-123');
 * if (profile) {
 *   console.log('Username:', profile.username);
 * }
 * ```
 */
export async function getProfile(userId: string): Promise<ProfileResponse> {
  try {
    logProfile('Fetching profile', { userId });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logProfile('Failed to fetch profile', { userId, error: error.message });
      return { data: null, error };
    }

    if (!data) {
      logProfile('Profile not found', { userId });
      return { data: null, error: new Error('Profile not found') };
    }

    // Validate the profile data
    if (!isValidProfile(data)) {
      logProfile('Invalid profile data structure', { userId, data });
      return { data: null, error: new Error('Invalid profile data structure') };
    }

    logProfile('Profile fetched successfully', {
      userId,
      username: data.username,
      hasAvatar: !!data.avatar_url,
    });

    return { data, error: null };
  } catch (error) {
    logger.error(
      'Unexpected error fetching profile',
      {
        userId,
        error: (error as Error).message,
      },
      'Profile'
    );

    return { data: null, error: error as Error };
  }
}

/**
 * Update a user's profile with validation and conflict handling
 * @param userId - Unique user identifier
 * @param updates - Profile fields to update
 * @returns Promise<ProfileUpdateResponse> - Updated profile data with status
 * @example
 * ```typescript
 * const result = await updateProfile('user-123', {
 *   username: 'newusername',
 *   name: 'New Display Name',
 *   bio: 'Updated bio'
 * });
 *
 * if (result.status === 'success') {
 *   console.log('Profile updated:', result.data?.username);
 * } else {
 *   console.error('Update failed:', result.error?.message);
 * }
 * ```
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdateData
): Promise<ProfileUpdateResponse> {
  try {
    logProfile('Updating profile', { userId, updates: Object.keys(updates) });

    // Add timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logProfile('Failed to update profile', {
        userId,
        error: error.message,
        code: error.code,
      });
      return { data: null, error, status: error.code };
    }

    if (!data) {
      logProfile('No profile returned after update', { userId });
      return {
        data: null,
        error: new Error('Profile update returned no data'),
        status: 'no_data',
      };
    }

    // Validate the updated profile data
    if (!isValidProfile(data)) {
      logProfile('Invalid updated profile data structure', { userId, data });
      return {
        data: null,
        error: new Error('Invalid updated profile data structure'),
        status: 'invalid_data',
      };
    }

    logProfile('Profile updated successfully', {
      userId,
      username: data.username,
      updatedFields: Object.keys(updates),
    });

    return { data, error: null, status: 'success' };
  } catch (error) {
    logger.error(
      'Unexpected error updating profile',
      {
        userId,
        error: (error as Error).message,
      },
      'Profile'
    );

    return {
      data: null,
      error: error as Error,
      status: 'unexpected_error',
    };
  }
}

/**
 * Create a new profile (typically called after user signup)
 * @param userId - Unique user identifier from auth system
 * @param profileData - Optional initial profile data
 * @returns Promise<ProfileResponse> - Created profile data or error
 * @example
 * ```typescript
 * const { data: profile, error } = await createProfile('user-123', {
 *   username: 'johndoe',
 *   name: 'John Doe'
 * });
 *
 * if (profile) {
 *   console.log('Profile created for:', profile.username);
 * }
 * ```
 */
export async function createProfile(
  userId: string,
  profileData: Partial<ProfileUpdateData> = {}
): Promise<ProfileResponse> {
  try {
    logProfile('Creating new profile', { userId });

    const newProfile = {
      id: userId,
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
      .insert(newProfile)
      .select()
      .single();

    if (error) {
      logProfile('Failed to create profile', {
        userId,
        error: error.message,
        code: error.code,
      });
      return { data: null, error };
    }

    if (!data) {
      logProfile('No profile returned after creation', { userId });
      return { data: null, error: new Error('Profile creation returned no data') };
    }

    // Validate the created profile data
    if (!isValidProfile(data)) {
      logProfile('Invalid created profile data structure', { userId, data });
      return { data: null, error: new Error('Invalid created profile data structure') };
    }

    logProfile('Profile created successfully', {
      userId,
      username: data.username,
    });

    return { data, error: null };
  } catch (error) {
    logger.error(
      'Unexpected error creating profile',
      {
        userId,
        error: (error as Error).message,
      },
      'Profile'
    );

    return { data: null, error: error as Error };
  }
}

/**
 * Check if a username is available for registration
 * @param username - Username to check availability
 * @returns Promise<boolean> - True if username is available, false otherwise
 * @example
 * ```typescript
 * const available = await isUsernameAvailable('johndoe');
 * if (available) {
 *   console.log('Username is available for registration');
 * } else {
 *   console.log('Username is already taken');
 * }
 * ```
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    logProfile('Checking username availability', { username });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: _data, error } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
      .select('id')
      .eq('username', username)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows returned - username is available
      logProfile('Username is available', { username });
      return true;
    }

    if (error) {
      logProfile('Error checking username availability', {
        username,
        error: error.message,
      });
      return false;
    }

    // Username exists
    logProfile('Username is not available', { username });
    return false;
  } catch (error) {
    logger.error(
      'Unexpected error checking username availability',
      {
        username,
        error: (error as Error).message,
      },
      'Profile'
    );

    return false;
  }
}

/**
 * Get profile by username for public profile viewing
 * @param username - Username to lookup
 * @returns Promise<ProfileResponse> - Profile data or error
 * @example
 * ```typescript
 * const { data: profile, error } = await getProfileByUsername('johndoe');
 * if (profile) {
 *   console.log('Profile found:', profile.name);
 * } else {
 *   console.log('Profile not found');
 * }
 * ```
 */
export async function getProfileByUsername(username: string): Promise<ProfileResponse> {
  try {
    logProfile('Fetching profile by username', { username });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      logProfile('Failed to fetch profile by username', {
        username,
        error: error.message,
      });
      return { data: null, error };
    }

    if (!data) {
      logProfile('Profile not found by username', { username });
      return { data: null, error: new Error('Profile not found') };
    }

    // Validate the profile data
    if (!isValidProfile(data)) {
      logProfile('Invalid profile data structure', { username, data });
      return { data: null, error: new Error('Invalid profile data structure') };
    }

    logProfile('Profile fetched by username successfully', {
      username,
      userId: data.id,
    });

    return { data, error: null };
  } catch (error) {
    logger.error(
      'Unexpected error fetching profile by username',
      {
        username,
        error: (error as Error).message,
      },
      'Profile'
    );

    return { data: null, error: error as Error };
  }
}

/**
 * Search profiles by display name or username with fuzzy matching
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 10)
 * @returns Promise<{data: Profile[], error: Error | null}> - Search results
 * @example
 * ```typescript
 * const { data: profiles, error } = await searchProfiles('john', 5);
 * if (profiles.length > 0) {
 *   console.log('Found profiles:', profiles.map(p => p.username));
 * }
 * ```
 */
export async function searchProfiles(
  query: string,
  limit: number = 10
): Promise<{ data: Profile[]; error: Error | null }> {
  try {
    logProfile('Searching profiles', { query, limit });

    const { data, error } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('*')
      .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      logProfile('Failed to search profiles', {
        query,
        error: error.message,
      });
      return { data: [], error };
    }

    const profiles = data || [];

    logProfile('Profile search completed', {
      query,
      resultsCount: profiles.length,
    });

    return { data: profiles, error: null };
  } catch (error) {
    logger.error(
      'Unexpected error searching profiles',
      {
        query,
        error: (error as Error).message,
      },
      'Profile'
    );

    return { data: [], error: error as Error };
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Validate profile data before database operations
 * @param data - Profile data to validate
 * @returns Validation result with detailed error messages
 * @example
 * ```typescript
 * const validation = validateProfileData({
 *   username: 'ab', // Too short
 *   bio: 'x'.repeat(600) // Too long
 * });
 *
 * if (!validation.isValid) {
 *   console.log('Validation errors:', validation.errors);
 * }
 * ```
 */
export function validateProfileData(data: Partial<ProfileUpdateData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Username validation
  if (data.username !== undefined) {
    if (data.username && data.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (data.username && data.username.length > 30) {
      errors.push('Username must be no more than 30 characters long');
    }

    if (data.username && !/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      errors.push('Username can only contain letters, numbers, hyphens, and underscores');
    }
  }

  // Display name validation
  if (data.name !== undefined && data.name) {
    if (data.name.length > 50) {
      errors.push('Display name must be no more than 50 characters long');
    }
  }

  // Bio validation
  if (data.bio !== undefined && data.bio) {
    if (data.bio.length > 500) {
      errors.push('Bio must be no more than 500 characters long');
    }
  }

  // Bitcoin address validation (basic)
  if (data.bitcoin_address !== undefined && data.bitcoin_address) {
    // Basic Bitcoin address validation - could be enhanced
    if (data.bitcoin_address.length < 26 || data.bitcoin_address.length > 62) {
      errors.push('Bitcoin address format appears invalid');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// ==================== EXPORTS ====================

export {
  type Profile,
  type ProfileUpdateData,
  type ProfileResponse,
  type ProfileUpdateResponse,
  isValidProfile,
} from '../types';
