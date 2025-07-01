'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, ProfileFormData } from '@/types/database'
import { signIn, signUp, signOut } from '@/services/supabase/auth/index'
import { getSupabaseClient } from '@/services/supabase/client'
import { updateProfile as supabaseUpdateProfile } from '@/services/supabase/profiles'
import { ProfileService } from '@/services/profileService'
import { logger } from '@/utils/logger'
import { getErrorMessage, type CatchError } from '@/types/common'

// FIXED: Use singleton client to prevent session conflicts
const supabase = getSupabaseClient()

interface AuthState {
  // data
  user: User | null
  session: Session | null
  profile: Profile | null
  // ui state
  isLoading: boolean
  error: string | null
  hydrated: boolean
  authError: string | null
  // actions
  /** Called exactly once in AuthProvider with the *server* values.  */
  setInitialAuthState: (user: User | null, session: Session | null, profile: Profile | null) => void
  /** Wipe local state + storage (used by signOut and invalid sessions). */
  clear: () => void
  /** Explicit sign-out button. */
  signOut: () => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ data: { user: User | null, session: Session | null } | null, error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ data: { user: User | null, session: Session | null } | null, error: Error | null }>
  /** Update user profile */
  updateProfile: (profileData: Partial<Profile>) => Promise<{ error: string | null }>
  /** Set error state */
  setError: (error: string | null) => void
  setAuthError: (error: string | null) => void
  fetchProfile: () => Promise<{ error: string | null }>
}

const STORAGE_KEY = 'orangecat-auth-storage'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ==================== STATE ====================
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      error: null,
      hydrated: true, // FIXED: Start hydrated to prevent infinite loading
      authError: null,

      // ==================== ACTIONS ====================
      setInitialAuthState: (user: User | null, session: Session | null, profile: Profile | null) => {
        // FIXED: Simplified state setting without complex validation
        set({ user, session, profile, hydrated: true, isLoading: false })
        logger.debug('Auth state initialized', { hasUser: !!user, hasSession: !!session, hasProfile: !!profile }, 'Auth')
      },

      clear: () => {
        set({
          user: null,
          session: null,
          profile: null,
          error: null,
          authError: null,
          isLoading: false
        })
        logger.debug('Auth state cleared', undefined, 'Auth')
      },

      setError: (error: string | null) => set({ error }),
      setAuthError: (authError: string | null) => set({ authError }),

      fetchProfile: async () => {
        const currentState = get()
        if (!currentState.user?.id) {
          return { error: 'No authenticated user' }
        }

        try {
          const profile = await ProfileService.getProfile(currentState.user.id)
          if (profile) {
            set({ profile })
            return { error: null }
          } else {
            logger.warn('No profile found for user', { userId: currentState.user.id }, 'Auth')
            return { error: 'Profile not found' }
          }
        } catch (error: CatchError) {
          const errorMessage = getErrorMessage(error)
          logger.error('Failed to fetch profile', { error: errorMessage }, 'Auth')
          return { error: errorMessage }
        }
      },

      signOut: async () => {
        set({ isLoading: true, authError: null })
        try {
          // Clear state first
          get().clear()
          
          // Clear browser storage
          if (typeof window !== 'undefined') {
            // Clear Supabase cookies
            document.cookie.split(';').forEach(cookie => {
              const trimmedCookie = cookie.trim()
              if (trimmedCookie.startsWith('sb-')) {
                const name = trimmedCookie.split('=')[0]
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
              }
            })
            
            // Clear localStorage items
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
                localStorage.removeItem(key)
              }
            })
            sessionStorage.removeItem(STORAGE_KEY)
          }
          
          // Sign out from Supabase
          const { error: supabaseError } = await signOut()
          
          if (supabaseError) {
            set({ authError: supabaseError.message, isLoading: false })
            return { error: supabaseError }
          }
          
          set({ isLoading: false, authError: null })
          return { error: null }
        } catch (e: CatchError) {
          const errMsg = getErrorMessage(e)
          set({ authError: errMsg, isLoading: false })
          return { error: new Error(errMsg) }
        }
      },

      // FIXED: Simplified signIn without complex validation layers
      signIn: async (email, password) => {
        const currentState = get()
        if (currentState.isLoading) {
          logger.warn("Sign in already in progress, ignoring duplicate request", undefined, 'Auth')
          return { data: null, error: new Error("Sign in already in progress") }
        }

        set({ isLoading: true, authError: null, error: null })
        logger.debug('Starting simplified sign-in process', { email }, 'Auth')
        
        try {
          // FIXED: Use direct signIn service call without additional security layers
          const result = await signIn({ email, password })
          
          if (result.error) {
            logger.error("Sign in error:", result.error.message, 'Auth')
            set({ authError: result.error.message, isLoading: false })
            return { data: null, error: result.error }
          }

          // FIXED: Set auth state immediately on success
          if (result.data?.user && result.data?.session) {
            set({ 
              user: result.data.user, 
              session: result.data.session, 
              isLoading: false, 
              authError: null,
              error: null
            })
            
            // Fetch profile after successful auth
            const profileResult = await get().fetchProfile()
            if (profileResult.error) {
              logger.warn('Profile fetch failed after sign in', { error: profileResult.error }, 'Auth')
            }
            
            logger.info('Sign in successful', { userId: result.data.user.id }, 'Auth')
            return { data: result.data, error: null }
          } else {
            set({ authError: 'No user data received', isLoading: false })
            return { data: null, error: new Error('No user data received') }
          }
        } catch (e: CatchError) {
          const errMsg = getErrorMessage(e)
          logger.error('Unexpected sign in error', { error: errMsg }, 'Auth')
          set({ authError: errMsg, isLoading: false })
          return { data: null, error: new Error(errMsg) }
        }
      },

      // FIXED: Simplified signUp
      signUp: async (email, password) => {
        const currentState = get()
        if (currentState.isLoading) {
          logger.warn("Sign up already in progress, ignoring duplicate request", undefined, 'Auth')
          return { data: null, error: new Error("Sign up already in progress") }
        }

        set({ isLoading: true, authError: null, error: null })
        logger.debug('Starting sign-up process', { email }, 'Auth')
        
        try {
          const result = await signUp({ email, password })
          
          if (result.error) {
            logger.error("Sign up error:", result.error.message, 'Auth')
            set({ authError: result.error.message, isLoading: false })
            return { data: null, error: result.error }
          }

          // Handle sign-up success (may require email confirmation)
          set({ isLoading: false, authError: null, error: null })
          logger.info('Sign up successful', { 
            userId: result.data?.user?.id,
            requiresConfirmation: !result.data?.session 
          }, 'Auth')
          
          return { data: result.data, error: null }
        } catch (e: CatchError) {
          const errMsg = getErrorMessage(e)
          logger.error('Unexpected sign up error', { error: errMsg }, 'Auth')
          set({ authError: errMsg, isLoading: false })
          return { data: null, error: new Error(errMsg) }
        }
      },

      updateProfile: async (profileData: Partial<Profile>) => {
        const currentState = get()
        if (!currentState.user?.id) {
          return { error: 'No authenticated user' }
        }

        try {
          set({ isLoading: true })
          
          const { error } = await supabaseUpdateProfile(currentState.user.id, profileData as ProfileFormData)
          
                     if (error) {
             set({ isLoading: false })
             return { error: String(error) }
          }

          // Refetch profile to get updated data
          const fetchResult = await get().fetchProfile()
          set({ isLoading: false })
          
          return fetchResult
        } catch (e: CatchError) {
          const errMsg = getErrorMessage(e)
          set({ isLoading: false })
          return { error: errMsg }
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        profile: state.profile,
        hydrated: state.hydrated,
      }),
      skipHydration: false,
    }
  )
)