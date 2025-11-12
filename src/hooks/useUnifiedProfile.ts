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
    setIsLoading(true)
    setError(null)

    try {
      // If username is provided, fetch that user's profile
      if (username) {
        // Handle "me" as a special case - show current user's profile
        if (username === 'me' || username.toLowerCase() === 'me') {
          if (user && currentUserProfile) {
            setProfile(currentUserProfile)
            return
          } else if (user) {
            setError('Profile not found')
            setProfile(null)
            return
          } else {
            setError('Authentication required')
            setProfile(null)
            return
          }
        }

        // Next.js route params are already decoded, but we need to encode for the API call
        // However, if it's already encoded (contains %), decode first then encode
        let usernameToEncode = username
        try {
          // Check if it's already encoded by trying to decode it
          const decoded = decodeURIComponent(username)
          // If decoding changes it, it was encoded - use the decoded version
          if (decoded !== username) {
            usernameToEncode = decoded
          }
        } catch {
          // If decoding fails, use as-is
        }
        const encodedUsername = encodeURIComponent(usernameToEncode)
        const response = await fetch(`/api/profile/${encodedUsername}`)
        const result = await response.json()

        if (!response.ok) {
          // Extract error message from API response
          const errorMessage = result.error?.message || result.error || 'Profile not found'
          setError(errorMessage)
          setProfile(null)
          return
        }

        if (result.success && result.data) {
          setProfile(result.data)
        } else {
          setError('Profile not found')
          setProfile(null)
        }
      } else {
        // No username provided - only show current user's profile if we're on /profile (not /profile/[username])
        // Check if we're on a route that expects a username by checking the URL
        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname
          // If pathname is exactly /profile (not /profile/something), show current user's profile
          if (pathname === '/profile' && user && currentUserProfile) {
            setProfile(currentUserProfile)
          } else if (pathname.startsWith('/profile/') && pathname !== '/profile') {
            // We're on /profile/[username] but username param is missing - wait for it
            setIsLoading(true)
            return
          } else if (user && currentUserProfile) {
            // Fallback: show current user's profile
            setProfile(currentUserProfile)
          } else if (user) {
            // User is logged in but no profile yet
            setError('Profile not found')
            setProfile(null)
          } else {
            // No user and no username - can't fetch
            setError('Authentication required')
            setProfile(null)
          }
        } else if (user && currentUserProfile) {
          // Server-side: show current user's profile if no username
          setProfile(currentUserProfile)
        } else {
          setError('Profile not found')
          setProfile(null)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile'
      setError(errorMessage)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [user, currentUserProfile, username])

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