'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ProfileService } from '@/services/profile'
import { ScalableProfile, ProfileFormData } from '@/types/database'
import { toast } from 'sonner'
import { logger } from '@/utils/logger'

export interface UseUnifiedProfileProps {
  username?: string
  initialProfile?: ScalableProfile
  autoFetch?: boolean
}

export interface UseUnifiedProfileReturn {
  profile: ScalableProfile | null
  isLoading: boolean
  error: string | null
  isOwnProfile: boolean
  mode: 'view' | 'edit'
  setMode: (mode: 'view' | 'edit') => void
  handleSave: (data: ProfileFormData) => Promise<void>
  refetch: () => Promise<void>
}

export function useUnifiedProfile({
  username,
  initialProfile,
  autoFetch = true
}: UseUnifiedProfileProps = {}): UseUnifiedProfileReturn {
  const router = useRouter()
  const { user, profile: currentUserProfile } = useAuth()
  
  // State
  const [profile, setProfile] = useState<ScalableProfile | null>(initialProfile || null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'view' | 'edit'>('view')

  // Determine if this is the user's own profile
  const isOwnProfile = profile?.id === user?.id

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      let profileData: ScalableProfile | null = null

      if (username === 'me' || !username) {
        // Loading current user's profile
        if (currentUserProfile) {
          // Cast the basic Profile to ScalableProfile since ScalableProfile extends Profile
          profileData = currentUserProfile as ScalableProfile
        } else {
          profileData = await ProfileService.getProfile(user.id)
        }
      } else {
        // Loading specific user's profile by username
        const profiles = await ProfileService.searchProfiles(username, 1, 0)
        if (profiles.length > 0) {
          profileData = profiles[0]
        }
      }

      if (!profileData) {
        setError('Profile not found')
        return
      }

      setProfile(profileData)
      
      // Increment profile views (only for other users' profiles)
      if (profileData.id !== user?.id) {
        await ProfileService.incrementProfileViews(profileData.id)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile'
      setError(errorMessage)
      logger.error('Profile fetch failed', err, 'useUnifiedProfile')
    } finally {
      setIsLoading(false)
    }
  }, [username, user, currentUserProfile])

  // Handle profile save
  const handleSave = useCallback(async (data: ProfileFormData) => {
    if (!user?.id || !profile) {
      throw new Error('User not authenticated')
    }

    try {
      const result = await ProfileService.updateProfile(user.id, data)
      
      if (result.success && result.data) {
        setProfile(result.data)
        toast.success('Profile updated successfully!')
        
        // Refresh current user profile in auth store if updating own profile
        if (isOwnProfile) {
          // TODO: Trigger auth store profile refresh
        }
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile'
      logger.error('Profile save failed', err, 'useUnifiedProfile')
      throw new Error(errorMessage)
    }
  }, [user, profile, isOwnProfile])

  // Refetch profile data
  const refetch = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && !initialProfile) {
      fetchProfile()
    }
  }, [autoFetch, initialProfile, fetchProfile])

  // Handle mode changes
  const handleModeChange = useCallback((newMode: 'view' | 'edit') => {
    if (newMode === 'edit' && !isOwnProfile) {
      toast.error('You can only edit your own profile')
      return
    }
    setMode(newMode)
  }, [isOwnProfile])

  return {
    profile,
    isLoading,
    error,
    isOwnProfile,
    mode,
    setMode: handleModeChange,
    handleSave,
    refetch
  }
} 