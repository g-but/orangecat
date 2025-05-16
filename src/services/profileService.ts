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
      console.log('ProfileService: Delegating to profile helper with data:', formData)
      
      // Check if user has auth session before attempting update
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('ProfileService: No active session, cannot update profile:', sessionError)
        return {
          success: false,
          error: 'No active session. Please log in again.',
        }
      }
      
      // Make sure user session belongs to same user we're updating
      if (session.user.id !== userId) {
        console.error(`ProfileService: Session user ID (${session.user.id}) does not match target user ID (${userId})`)
        return {
          success: false,
          error: 'Permission denied: You can only update your own profile',
        }
      }
      
      // Direct call to supabaseUpdateProfile without retries or timeouts
      console.log('ProfileService: DIRECT CALL to supabaseUpdateProfile')
      const updatedProfile = await supabaseUpdateProfile(userId, formData)
      return {
        success: true,
        data: updatedProfile,
      }
    } catch (error: any) {
      console.error('ProfileService: ERROR during direct profile update:', error)
      
      // Check for specific error types
      let errorMessage = error.message || 'Unknown error updating profile'
      
      if (error.code === '42501') {
        errorMessage = 'Permission denied: Row level security prevented this update'
      } else if (error.code === '23505') {
        errorMessage = 'Username is already taken'
      } else if (error.status === 401 || error.code === 'PGRST301') {
        errorMessage = 'Authentication error: Please sign in again'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your network connection and try again.'
      } else if (error.message?.includes('message channel closed')) {
        errorMessage = 'Connection interrupted. Please try again.'
      }
      
      return {
        success: false,
        error: errorMessage,
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
      const newProfile = {
        id: userId, // Primary key that must match auth.users.id
        username: formData.username || null,
        display_name: formData.display_name || null,
        bio: formData.bio || null,
        avatar_url: formData.avatar_url || null,
        bitcoin_address: formData.bitcoin_address || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
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