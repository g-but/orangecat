'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, ProfileFormData } from '@/types/database'
import supabase from '@/services/supabase/client'
import { updateProfile as supabaseUpdateProfile } from '@/services/supabase/profiles'

interface AuthState {
  // data
  user: User | null
  session: Session | null
  profile: Profile | null
  // ui state
  isLoading: boolean
  error: string | null
  hydrated: boolean
  // actions
  /** Called exactly once in AuthProvider with the *server* values.  */
  setInitialAuthState: (user: User | null, session: Session | null, profile: Profile | null) => void
  /** Wipe local state + storage (used by signOut and invalid sessions). */
  clear: () => void
  /** Explicit sign-out button. */
  signOut: () => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  /** Update user profile */
  updateProfile: (profileData: Partial<Profile>) => Promise<{ error: string | null }>
  /** Set error state */
  setError: (error: string | null) => void
  fetchProfile: () => Promise<{ error: string | null }>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ---------------- default state ----------------
      user: null,
      session: null,
      profile: null,
      isLoading: true,     // true until we *know* something
      error: null,
      hydrated: false,
      // ---------------- actions ----------------
      setInitialAuthState: (user, session, profile) => {
        // ALWAYS trust the server snapshot – even if it's null
        set({
          user,
          session,
          profile,
          isLoading: false,
          hydrated: true,
          error: null,
        })
      },
      clear: () => {
        set({
          user: null,
          session: null,
          profile: null,
          isLoading: false,
          error: null,
        })
        // purge persisted copy so the zombie can't rise again
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('orangecat-auth')
        }
      },
      fetchProfile: async () => {
        const { user, session } = get() // also get session to ensure we are acting on an authenticated user
        if (!user || !session) { // if no user or session, no point fetching profile
          set({ profile: null, isLoading: false, error: 'User not authenticated' }) // Clear profile, stop loading
          return { error: 'User not authenticated' }
        }

        set({ isLoading: true, error: null }) // Indicate loading before fetch, clear previous error
        try {
          // @ts-ignore - Ignore type error for helper function
          const { data: profileData, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (fetchError) {
            if (fetchError.code === 'PGRST116') { // Profile does not exist
              set({ profile: null, isLoading: false }) // Set profile to null, stop loading
              return { error: null } // Not an application error, profile just doesn't exist
            }
            throw fetchError // Re-throw other errors to be caught below
          }
          // Profile successfully fetched
          set({ profile: profileData, isLoading: false })
          return { error: null }
        } catch (error: any) {
          console.error('Error fetching profile:', error)
          set({ profile: null, isLoading: false, error: error.message }) // Clear profile on error, stop loading
          return { error: error.message }
        }
      },
      signOut: async () => {
        set({ isLoading: true, error: null })
        try {
          // First clear all local state
          get().clear()
          
          // Clear all cookies manually - for browser-side cookie cleanup
          if (typeof window !== 'undefined') {
            document.cookie.split(';').forEach(cookie => {
              const trimmedCookie = cookie.trim()
              if (trimmedCookie.startsWith('sb-')) {
                const name = trimmedCookie.split('=')[0]
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
              }
            })
            
            // Clear localStorage items related to Supabase auth
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
                localStorage.removeItem(key)
              }
            })
            
            // Clear sessionStorage
            sessionStorage.removeItem('orangecat-auth')
          }
          
          // Then call Supabase signOut
          const { error: supabaseError } = await supabase.auth.signOut()
          
          if (supabaseError) throw supabaseError
          
          // Finally, redirect to server-side signout for complete cleanup
          window.location.href = '/auth/signout'
          
          return { error: null }
        } catch (e: any) {
          console.error('Error during sign out:', e)
          return { error: e?.message ?? 'Unknown error during sign out' }
        } finally {
          set({ isLoading: false })
        }
      },
      signIn: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ 
            email, 
            password
          })
          
          if (error) throw error

          // After successful sign in, user and session are set by onAuthStateChange.
          // onAuthStateChange will also trigger fetchProfile.
          if (data.user && data.session) {
            // Wait for onAuthStateChange to set user/session, then ensure profile is fetched
            await new Promise(resolve => setTimeout(resolve, 0)); // allow state update cycle
            
            // Make sure the profile exists by checking it, and creating if needed
            const { data: profileData, error: profileCheckError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();
              
            console.log('Profile check after login:', { profileData, profileCheckError });
              
            // If profile doesn't exist, create it
            if (!profileData && !profileCheckError) {
              console.log('No profile found, creating one for user:', data.user.id);
              
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .upsert({ 
                  id: data.user.id, 
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select('*')
                .single();
                
              console.log('Profile creation result:', { newProfile, createError });
              
              if (createError) {
                console.error('Error creating profile after login:', createError);
              } else if (newProfile) {
                // Update the store with the new profile
                set({ profile: newProfile });
              }
            }
            
            // Continue with regular profile fetch
            const { error: profileError } = await get().fetchProfile()
            if (profileError) {
              console.error('Error fetching profile after sign in:', profileError)
            }
          }
          
          return { error: null }
        } catch (error: any) {
          console.error('Sign in error:', error)
          set({ error: error.message })
          return { error: error.message }
        } finally {
          // Always ensure we exit the loading state
          set({ isLoading: false })
        }
      },
      signUp: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          // Set up a timeout for the request
          const { data, error } = await Promise.race([
            supabase.auth.signUp({ 
              email, 
              password
            }),
            new Promise<{data: null, error: Error}>((_, reject) => 
              setTimeout(() => reject(new Error('Sign up request timed out. Please try again.')), 8000)
            )
          ])
          
          if (error) throw error
          
          // On successful sign up, the session should be updated by onAuthStateChange
          if (data.user) {
            // Fetch profile immediately after sign up
            await get().fetchProfile()
          }
          
          return { error: null }
        } catch (error: any) {
          console.error('Sign up error:', error)
          set({ error: error.message })
          return { error: error.message }
        } finally {
          // Always ensure we exit the loading state 
          set({ isLoading: false })
        }
      },
      updateProfile: async (profileData: Partial<Profile>) => {
        const { user } = get();
        if (!user) {
          console.error('AuthStore: updateProfile failed - User not found.');
          return { error: 'User not found. Please log in again.' };
        }

        // Set loading state
        set({ isLoading: true, error: null });
        console.log('AuthStore: updateProfile started. isLoading: true', { user_id: user.id });

        try {
          // Directly use the profileData and cast as ProfileFormData to avoid type conversion issues
          const data = await supabaseUpdateProfile(user.id, profileData as unknown as ProfileFormData);
          
          // Update the store with the result
          set({ 
            profile: data, 
            isLoading: false, 
            error: null 
          });
          
          console.log('AuthStore: Profile updated successfully:', data);
          return { error: null };
        } catch (error: any) {
          console.error('AuthStore: Error during profile update:', error);
          const errorMessage = error.message || 'An unexpected error occurred during profile update.';
          set({ isLoading: false, error: errorMessage });
          return { error: errorMessage };
        }
      },
      setError: (error) => {
        set({ error })
      },
    }),
    {
      name: 'orangecat-auth',
      storage: typeof window !== 'undefined'
        ? createJSONStorage(() => localStorage)
        : undefined,
      // Don't persist loading state
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        profile: state.profile,
        error: state.error,
      }),
    }
  )
)

// ---------- live session watcher (client only) ----------
if (supabase) {
  supabase.auth.onAuthStateChange(async (_event, session) => {
    const { setInitialAuthState, clear, fetchProfile } = useAuthStore.getState()
    if (session?.user) {
      // First set the user and session, profile to null initially
      setInitialAuthState(session.user, session, null) 
      // Then fetch the profile. The fetchProfile will update the store's profile state.
      const { error } = await fetchProfile() 
      if (error) {
        // fetchProfile already logs and sets error state in store
        console.error('Error reported by fetchProfile on auth state change:', error)
      }
    } else {
      clear()
    }
  })
}