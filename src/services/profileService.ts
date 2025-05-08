import { createClient } from '@/services/supabase/client'
import { Profile, ProfileFormData } from '@/types/database'

export class ProfileService {
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  static async updateProfile(userId: string, formData: ProfileFormData): Promise<{ success: boolean; error?: string }> {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is missing. Please try logging in again.' }
      }

      const supabase = createClient()
      
      // First, check if the profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching existing profile:', fetchError)
        return { success: false, error: 'Could not find your profile. Please try again.' }
      }

      if (!existingProfile) {
        // If profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            display_name: formData.display_name || null,
            bio: formData.bio || null,
            bitcoin_address: formData.bitcoin_address || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error creating profile:', insertError)
          return { success: false, error: 'Failed to create profile' }
        }
        return { success: true }
      }

      // Update the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name || null,
          bio: formData.bio || null,
          bitcoin_address: formData.bitcoin_address || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Supabase update error:', updateError)
        return { success: false, error: `Failed to update profile: ${updateError.message}` }
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating profile:', error)
      return {
        success: false,
        error: error instanceof Error ? `An unexpected error occurred: ${error.message}` : 'An unexpected error occurred while updating your profile'
      }
    }
  }

  static async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
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