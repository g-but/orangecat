'use client'

import { logger } from '@/utils/logger'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'
import { supabase } from '@/lib/supabase/browser'

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
  setInitialAuthState: (user: User | null, session: Session | null, profile: Profile | null) => void
  clear: () => void
  signOut: () => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ data: { user: User | null, session: Session | null } | null, error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ data: { user: User | null, session: Session | null } | null, error: Error | null }>
  updateProfile: (profileData: Partial<Profile>) => Promise<{ error: string | null }>
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
      hydrated: true,
      authError: null,

      // ==================== ACTIONS ====================
      setInitialAuthState: (user: User | null, session: Session | null, profile: Profile | null) => {
        set({ user, session, profile, hydrated: true, isLoading: false })
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
      },

      setError: (error: string | null) => set({ error }),
      setAuthError: (authError: string | null) => set({ authError }),

      fetchProfile: async () => {
        const currentState = get()
        if (!currentState.user?.id) {
          return { error: 'No authenticated user' }
        }

        try {
          const response = await fetch('/api/profile')
          const result = await response.json()

          if (!response.ok) {
            return { error: result.error || 'Failed to fetch profile' }
          }

          if (result.success && result.data) {
            set({ profile: result.data })
            return { error: null }
          } else {
            return { error: 'Profile not found' }
          }
        } catch (error) {
          logger.error('Failed to fetch profile:', error)
          return { error: 'Failed to fetch profile' }
        }
      },

      signOut: async () => {
        set({ isLoading: true, authError: null })
        try {
          const { error } = await supabase.auth.signOut()
          
          if (error) {
            set({ authError: error.message, isLoading: false })
            return { error }
          }
          
          get().clear()
          set({ isLoading: false, authError: null })
          return { error: null }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : 'Sign out failed'
          set({ authError: errMsg, isLoading: false })
          return { error: new Error(errMsg) }
        }
      },

      signIn: async (email, password) => {
        const currentState = get()
        if (currentState.isLoading) {
          return { data: null, error: new Error("Sign in already in progress") }
        }

        set({ isLoading: true, authError: null, error: null })
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          
          if (error) {
            set({ authError: error.message, isLoading: false })
            return { data: null, error }
          }

          if (data?.user && data?.session) {
            set({ 
              user: data.user, 
              session: data.session, 
              isLoading: false, 
              authError: null,
              error: null
            })
            
            // Fetch profile after successful auth
            await get().fetchProfile()
            
            return { data, error: null }
          } else {
            set({ authError: 'No user data received', isLoading: false })
            return { data: null, error: new Error('No user data received') }
          }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : 'Sign in failed'
          set({ authError: errMsg, isLoading: false })
          return { data: null, error: new Error(errMsg) }
        }
      },

      signUp: async (email, password) => {
        const currentState = get()
        if (currentState.isLoading) {
          return { data: null, error: new Error("Sign up already in progress") }
        }

        set({ isLoading: true, authError: null, error: null })
        
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          })
          
          if (error) {
            set({ authError: error.message, isLoading: false })
            return { data: null, error }
          }

          // Handle successful sign up - check if we have a session
          if (data?.user && data?.session) {
            set({ 
              user: data.user, 
              session: data.session, 
              isLoading: false, 
              authError: null,
              error: null
            })
            
            // Fetch profile after successful auth
            await get().fetchProfile()
            
            return { data, error: null }
          } else {
            // Sign up successful but no immediate session (email confirmation required)
            set({ isLoading: false, authError: null, error: null })
            return { data, error: null }
          }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : 'Sign up failed'
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
          
          const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
          })

          const result = await response.json()

          if (!response.ok) {
            set({ isLoading: false })
            return { error: result.error || 'Failed to update profile' }
          }

          // Refetch profile to get updated data
          const fetchResult = await get().fetchProfile()
          set({ isLoading: false })
          
          return fetchResult
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : 'Update profile failed'
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