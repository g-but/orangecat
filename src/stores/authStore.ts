import { create } from 'zustand'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  display_name: string
  bio: string
  bitcoin_address: string
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearAuth: () => void
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearAuth: () => set({ user: null, profile: null, error: null })
}))

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setUser(session?.user ?? null)
  useAuthStore.getState().setLoading(false)

  if (session?.user) {
    // Fetch profile data
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data: profile, error }) => {
        if (error) {
          console.error('Error fetching profile:', error)
          useAuthStore.getState().setError('Failed to load profile')
        } else {
          useAuthStore.getState().setProfile(profile)
        }
      })
  }
})

// Subscribe to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().setUser(session?.user ?? null)
  
  if (event === 'SIGNED_OUT') {
    useAuthStore.getState().clearAuth()
  } else if (session?.user) {
    // Fetch profile data on sign in
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data: profile, error }) => {
        if (error) {
          console.error('Error fetching profile:', error)
          useAuthStore.getState().setError('Failed to load profile')
        } else {
          useAuthStore.getState().setProfile(profile)
        }
      })
  }
}) 