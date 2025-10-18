'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Profile } from '@/types/database'
import { ProfileData } from '@/lib/validation'
import { toast } from 'sonner'

export interface UseUnifiedProfileProps {
  username?: string
  initialProfile?: Profile
  autoFetch?: boolean
}

export interface UseUnifiedProfileReturn {
  profile: Profile | null
  isLoading: boolean
  error: string | null
  isOwnProfile: boolean
  mode: 'view' | 'edit'
  setMode: (mode: 'view' | 'edit') => void
  handleSave: (data: ProfileData) => Promise<void>
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
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'view' | 'edit'>('view')

  // Determine if this is the user's own profile
  const isOwnProfile = profile?.id === user?.id

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!user) {return}

    setIsLoading(true)
    setError(null)

    try {
      // For now, just use the current user profile from auth store
      // In the future, we can add username-based profile fetching
      if (currentUserProfile) {
        setProfile(currentUserProfile)
      } else {
        setError('Profile not found')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [user, currentUserProfile])

  // Handle profile save
  const handleSave = useCallback(async (data: ProfileData) => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      if (result.success && result.data) {
        setProfile(result.data)
        toast.success('Profile updated successfully!')
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile'
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
  }, [user])

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