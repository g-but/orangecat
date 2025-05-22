'use client'

import supabase from './client'
import type { Profile, ProfileFormData } from '@/types/database'

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

export async function updateProfile(
  userId: string,
  formData: ProfileFormData
) {
  console.log(`ProfileHelper: Starting profile update for user ${userId}`, formData);
  
  try {
    // Get fresh user data using getUser instead of getSession
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('ProfileHelper: Authentication error:', userError);
      throw new Error('Authentication error: Please log in again');
    }
    
    if (!user) {
      console.error('ProfileHelper: No authenticated user');
      throw new Error('No authenticated user: Please log in again');
    }
    
    if (user.id !== userId) {
      console.error('ProfileHelper: User ID mismatch', { 
        authenticatedUserId: user.id, 
        targetUserId: userId 
      });
      throw new Error('Permission denied: You can only update your own profile');
    }
    
    // Dynamically build payload to avoid sending columns that may not exist in
    // the current DB schema (e.g. avatar_url) and therefore trigger PGRST204.
    const profileData: Record<string, any> = {
      id: userId,
      updated_at: new Date().toISOString(),
    };

    if (typeof formData.username !== 'undefined') {
      profileData.username = formData.username?.trim() ?? null;
    }
    if (typeof formData.display_name !== 'undefined') {
      profileData.display_name = formData.display_name?.trim() ?? null;
    }
    if (typeof formData.bio !== 'undefined') {
      profileData.bio = formData.bio?.trim() ?? null;
    }
    if (typeof formData.bitcoin_address !== 'undefined') {
      profileData.bitcoin_address = formData.bitcoin_address?.trim() ?? null;
    }
    if (typeof formData.avatar_url !== 'undefined') {
      profileData.avatar_url = formData.avatar_url ?? null;
    }
    
    console.log('ProfileHelper: Prepared update data:', profileData);
    
    // First check if the profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('ProfileHelper: Error checking profile existence:', checkError);
      throw new Error('Failed to verify profile existence');
    }
    
    let result;
    
    if (!existingProfile) {
      // Profile doesn't exist, create it
      console.log('ProfileHelper: Profile does not exist, creating new profile');
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select('*')
        .single();
        
      if (error) {
        console.error('ProfileHelper: Error creating profile:', error);
        throw error;
      }
      
      result = data;
    } else {
      // Profile exists, update it
      console.log('ProfileHelper: Updating existing profile');
      let { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select('*')
        .single();
        
      // retry without avatar_url if column missing
      if (error && error.code === 'PGRST204' && error.message?.includes('avatar_url')) {
        const retry = { ...profileData } as any;
        delete retry.avatar_url;
        const retryRes = await supabase
          .from('profiles')
          .update(retry)
          .eq('id', userId)
          .select('*')
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }
      
      if (error) {
        console.error('ProfileHelper: Error updating profile:', error);
        
        if (error.code === '23505') {
          throw new Error('Username is already taken. Please choose another username.');
        }
        
        throw error;
      }
      
      result = data;
    }
    
    if (!result) {
      throw new Error('Profile operation failed: No data returned from database');
    }
    
    console.log('ProfileHelper: Operation successful!', result);
    return result;
  } catch (error: any) {
    console.error('ProfileHelper: Exception during profile operation:', error);
    
    // Enhance error message for common cases
    if (error.message.includes('duplicate key')) {
      throw new Error('Username is already taken. Please choose another username.');
    }
    
    if (error.message.includes('permission denied')) {
      throw new Error('Permission denied: You do not have access to update this profile.');
    }
    
    if (error.message.includes('network')) {
      throw new Error('Network error: Please check your internet connection and try again.');
    }
    
    throw error;
  }
} 