import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Profile {
  id: string
  username?: string | null
  display_name: string | null
  avatar_url?: string | null
  bio: string | null
  bitcoin_address: string | null
  created_at: string
  updated_at: string
}

interface AuthState {
  user: any | null
  session: any | null
  profile: any | null
  isLoading: boolean
  isAdmin: boolean
  error: string | null
  hydrated: boolean

  setInitialAuthState: (user: any, session: any, profile: any) => void
  setUser: (user: any) => void
  setSession: (session: any) => void
  setProfile: (profile: any) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setHydrated: (hydrated: boolean) => void

  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  checkProfileCompletion: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isAdmin: false,
      error: null,
      hydrated: false,

      setInitialAuthState: (user, session, profile) => {
        console.log('AuthStore - setInitialAuthState: Hydrating with server props:', { user, session, profile })
        set({
          user,
          session,
          profile,
          isLoading: false,
          hydrated: true,
          error: null,
          isAdmin: user?.app_metadata?.role === 'admin'
        })
        console.log('AuthStore - setInitialAuthState: State updated, hydrated set to true')
      },

      setUser: (user) => {
        console.log('AuthStore - Setting user:', user)
        set({ user })
      },

      setSession: (session) => {
        console.log('AuthStore - Setting session:', session)
        set({ session })
      },

      setProfile: (profile) => {
        console.log('AuthStore - Setting profile:', profile)
        set({ profile })
      },

      setLoading: (isLoading) => {
        console.log('AuthStore - Setting loading:', isLoading)
        set({ isLoading })
      },

      setError: (error) => {
        console.log('AuthStore - Setting error:', error)
        set({ error })
      },

      setHydrated: (hydrated) => {
        console.log('AuthStore - Setting hydrated:', hydrated)
        set({ hydrated })
      },

      signIn: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) throw error

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (profileError) throw profileError

          set({
            user: data.user,
            session: data.session,
            profile,
            isAdmin: data.user?.app_metadata?.role === 'admin',
            isLoading: false,
          })

          return {}
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
          return { error: error.message }
        }
      },

      signUp: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            },
          })

          if (error) throw error
          if (!data.user) throw new Error('No user returned from sign up')

          const userId = data.user.id
          const now = new Date().toISOString()
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              display_name: null,
              bio: null,
              bitcoin_address: null,
              created_at: now,
              updated_at: now,
            })
          if (profileError) throw profileError

          const { data: profile, error: fetchProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
          if (fetchProfileError) throw fetchProfileError

          set({ user: data.user, session: data.session, profile, isLoading: false })
          return {}
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
          return { error: error.message }
        }
      },

      signOut: async () => {
        set({ isLoading: true, error: null })
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          set({ user: null, session: null, profile: null, isLoading: false })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
        }
      },

      checkProfileCompletion: () => {
        const { profile } = get()
        return !!(profile?.username && profile?.bitcoin_address)
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        console.log('AuthStore - onRehydrateStorage: Data (if any) has been loaded from localStorage into the store.')
        if (state) {
          state.setHydrated(true)
        }
      }
    }
  )
)

// Initialization effect: check for existing session/user on app start
// (Removed: now handled by AuthProvider hydration) 