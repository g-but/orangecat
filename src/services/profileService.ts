'use client'

import supabase from '@/services/supabase/client'
import { Profile, ProfileFormData } from '@/types/database'
import { useAuthStore } from '@/store/auth'
import { updateProfile as supabaseUpdateProfile } from '@/services/supabase/profiles'
import { toast } from 'sonner'

export interface ProfileUpdateResult {
  success: boolean
  data?: any
  error?: string
}

export class ProfileService {
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      console.log('ProfileService: Getting profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('ProfileService: Error fetching profile:', error);
        throw error;
      }
      
      console.log('ProfileService: Profile fetched successfully:', data);
      return data
    } catch (error) {
      console.error('ProfileService: Exception in getProfile:', error)
      return null
    }
  }

  /**
   * Update a user's profile
   */
  static async updateProfile(userId: string, formData: ProfileFormData): Promise<ProfileUpdateResult> {
    console.log('ProfileService: UPDATE STARTED for user ID:', userId)

    // Validate input
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      }
    }

    try {
      console.log('ProfileService: Validating session and preparing update data');
      
      // Get fresh session data using getUser instead of getSession
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('ProfileService: No authenticated user:', userError)
        return {
          success: false,
          error: 'No authenticated user. Please log in again.',
        }
      }
      
      // Make sure user ID matches
      if (user.id !== userId) {
        console.error(`ProfileService: User ID (${user.id}) does not match target ID (${userId})`)
        return {
          success: false,
          error: 'Permission denied: You can only update your own profile',
        }
      }

      // Build the update object **dynamically** so that we only send columns that
      // (a) are provided by the user and
      // (b) are known to exist in the database schema.  
      // This prevents 400 PGRST204 errors such as
      // "Could not find the 'avatar_url' column of 'profiles' in the schema cache".

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(), // always update timestamp
      };

      if (typeof formData.username !== 'undefined') {
        updateData.username = formData.username?.trim() || null;
      }

      if (typeof formData.display_name !== 'undefined') {
        updateData.display_name = formData.display_name?.trim() || null;
      }

      if (typeof formData.bio !== 'undefined') {
        updateData.bio = formData.bio?.trim() || null;
      }

      if (typeof formData.bitcoin_address !== 'undefined') {
        updateData.bitcoin_address = formData.bitcoin_address?.trim() || null;
      }

      // Only include avatar_url if the client actually provided a value.
      // If the column is missing in the DB this key will be absent and the
      // request will succeed instead of throwing a 400 error.
      if (typeof formData.avatar_url !== 'undefined') {
        updateData.avatar_url = formData.avatar_url || null;
      }
       
      console.log('ProfileService: Attempting direct update with data:', updateData);

      // Try direct update first
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        console.error('ProfileService: Direct update failed:', error);
        
        if (error.code === 'PGRST204' && error.message?.includes('avatar_url')) {
          console.warn('avatar_url column missing, retrying update without avatar_url');
          const retryData = { ...updateData };
          delete retryData.avatar_url;
          const { data: retryDataRes, error: retryErr } = await supabase
            .from('profiles')
            .update(retryData)
            .eq('id', userId)
            .select('*')
            .single();

          if (!retryErr) {
            return { success: true, data: retryDataRes };
          }
        } else if (error.code === '23505') {
          return {
            success: false,
            error: 'Username is already taken. Please choose another username.'
          };
        }
        
        // If direct update fails, try the fallback method
        console.log('ProfileService: Trying fallback update method');
        const fallbackResult = await ProfileService.fallbackProfileUpdate(userId, updateData);
        
        if (!fallbackResult.success) {
          return {
            success: false,
            error: fallbackResult.error || 'Failed to update profile'
          };
        }
        
        // If fallback succeeded, fetch the updated profile
        const { data: updatedProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (fetchError) {
          return {
            success: false,
            error: 'Profile updated but failed to fetch updated data'
          };
        }
        
        return {
          success: true,
          data: updatedProfile
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Profile update failed: No data returned'
        };
      }

      console.log('ProfileService: Update successful:', data);
      return {
        success: true,
        data
      };
      
    } catch (error: any) {
      console.error('ProfileService: Error during profile update:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile'
      }
    }
  }
  
  // Fallback method for profile updates that might be failing due to RLS policies
  static async fallbackProfileUpdate(userId: string, updates: any): Promise<{ success: boolean; error?: string }> {
    console.log('ProfileService: Attempting fallback profile update method');
    try {
      // First, try to get the current profile for comparison
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (fetchError) {
        console.error('ProfileService: Fallback - Error fetching current profile:', fetchError);
        return { 
          success: false, 
          error: `Could not fetch current profile: ${fetchError.message}`
        };
      }
      
      // If we have a current profile, we can try an RPC function call if one exists
      // or try with a different API endpoint approach
      
      // Method 1: Try using RPC if available (requires server function to be created)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'update_profile', 
          { profile_data: updates }
        );
        
        if (!rpcError) {
          console.log('ProfileService: Fallback - RPC update succeeded:', rpcData);
          return { success: true };
        }
        console.log('ProfileService: Fallback - RPC method failed, trying alternative');
      } catch (rpcFallbackError) {
        console.log('ProfileService: Fallback - RPC not available, trying alternative method');
      }
      
      // Method 2: Try REST API directly with retries
      const maxRetries = 3;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
            
          if (!error) {
            console.log(`ProfileService: Fallback - Update succeeded on attempt ${attempt + 1}:`, data);
            return { success: true };
          }
          
          console.log(`ProfileService: Fallback - Update attempt ${attempt + 1} failed:`, error);
          // Wait briefly before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (retryError) {
          console.error(`ProfileService: Fallback - Exception in retry attempt ${attempt + 1}:`, retryError);
        }
      }
      
      // If we reach here, all update methods failed
      return {
        success: false,
        error: 'All profile update methods failed. This may be a permissions issue or a database constraint violation.'
      };
    } catch (fallbackError: any) {
      console.error('ProfileService: Exception in fallback update method:', fallbackError);
      return {
        success: false,
        error: `Fallback update failed: ${fallbackError.message || 'Unknown error'}`
      };
    }
  }

  static async createProfile(userId: string, formData: ProfileFormData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('ProfileService: Creating new profile for user:', userId);
      
      // Based on the latest migration schema (20240325000000_clean_profile_schema.sql)
      // id uuid references auth.users on delete cascade primary key,
      // username text unique,
      // display_name text,
      // bio text,
      // avatar_url text,
      // bitcoin_address text,
      // lightning_address text,
      // created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      // updated_at timestamp with time zone default timezone('utc'::text, now()) not null
      const newProfile: Record<string, any> = {
        id: userId, // Primary key that must match auth.users.id
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (typeof formData.username !== 'undefined') {
        newProfile.username = formData.username ?? null;
      }
      if (typeof formData.display_name !== 'undefined') {
        newProfile.display_name = formData.display_name ?? null;
      }
      if (typeof formData.bio !== 'undefined') {
        newProfile.bio = formData.bio ?? null;
      }
      if (typeof formData.avatar_url !== 'undefined') {
        newProfile.avatar_url = formData.avatar_url ?? null;
      }
      if (typeof formData.bitcoin_address !== 'undefined') {
        newProfile.bitcoin_address = formData.bitcoin_address ?? null;
      }
      
      console.log('ProfileService: Sending create request with data:', newProfile);
      
      // First check if a profile already exists (might have been created by trigger)
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (existingProfile) {
        console.log('ProfileService: Profile already exists, updating instead');
        // Use upsert to update the existing profile 
        const { data, error } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();
          
        if (error) {
          console.error('ProfileService: Error updating existing profile:', error);
          return {
            success: false,
            error: `Failed to update profile: ${error.message || 'Unknown error'}`
          };
        }
        
        console.log('ProfileService: Profile updated successfully:', data);
        return { success: true };
      }
        
      // If no profile exists, insert a new one
      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();
        
      if (error) {
        console.error('ProfileService: Error creating profile:', error);
        return {
          success: false,
          error: `Failed to create profile: ${error.message || 'Unknown error'}`
        };
      }
      
      if (!data) {
        console.error('ProfileService: No data returned from profile creation');
        return {
          success: false,
          error: 'No data returned from profile creation'
        };
      }
      
      console.log('ProfileService: Profile created successfully:', data);
      return { success: true };
    } catch (err: any) {
      console.error('ProfileService: Exception during profile creation:', err);
      return {
        success: false,
        error: `Unexpected error creating profile: ${err.message || 'Unknown error'}`
      };
    }
  }

  static async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error updating password:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update password'
      }
    }
  }
} 