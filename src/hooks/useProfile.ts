import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Profile, ProfileFormData, PasswordFormData } from '@/types/database'
import { ProfileService } from '@/services/profileService'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const profileData = await ProfileService.getProfile(user.id)
      setProfile(profileData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  const updateProfile = async (formData: ProfileFormData) => {
    if (!user) return { success: false, error: 'Not authenticated' }

    try {
      setLoading(true)
      setError(null)
      const result = await ProfileService.updateProfile(user.id, formData)
      if (result.success) {
        await refreshProfile()
      }
      return result
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update profile'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (formData: PasswordFormData) => {
    if (!user) return { success: false, error: 'Not authenticated' }

    if (formData.newPassword !== formData.confirmPassword) {
      return { success: false, error: 'New passwords do not match' }
    }

    try {
      setLoading(true)
      setError(null)
      const result = await ProfileService.updatePassword(formData.newPassword)
      return result
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update password'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile,
    updatePassword
  }
} 