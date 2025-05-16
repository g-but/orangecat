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
    if (!userId) {
      throw new Error('User ID is required for profile update');
    }
    
    // Prepare update data with basic sanitization
    const profileData = {
      id: userId, // Include ID for upsert operation
      username: formData.username?.trim() ?? null,
      display_name: formData.display_name?.trim() ?? null,
      bio: formData.bio?.trim() ?? null,
      bitcoin_address: formData.bitcoin_address?.trim() ?? null,
      avatar_url: formData.avatar_url ?? null,
      updated_at: new Date().toISOString()
    };
    
    console.log('ProfileHelper: Using upsert operation to ensure profile exists');
    
    // Direct Supabase call without manual timeout or wrapping
    const { data, error, status } = await supabase
      .from('profiles')
      .upsert(profileData, { 
        onConflict: 'id', // If row exists with this ID, update it
        ignoreDuplicates: false // We want to update existing rows
      })
      .select('*')
      .single();
    
    console.log('[PROFILE-UPDATE]', { status, data, error });
    
    if (error) {
      console.error('ProfileHelper: Error during upsert:', error);
      
      if (error.code === '23505') {
        throw new Error('Username is already taken. Please choose another username.');
      }
      
      throw error;
    }
    
    if (!data) {
      console.error('ProfileHelper: No data returned from upsert');
      // If no data was returned, let's verify if the profile was updated by fetching it
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (verifyError) {
        throw new Error('Profile update failed: Could not verify update');
      }
      
      if (verifyData) {
        console.log('ProfileHelper: Update verified through separate fetch!', verifyData);
        return verifyData;
      }
      
      throw new Error('Profile update failed: No data returned from database');
    }
    
    console.log('ProfileHelper: Update successful!', data);
    return data;
  } catch (error) {
    console.error('ProfileHelper: Exception during profile update:', error);
    throw error;
  }
} 