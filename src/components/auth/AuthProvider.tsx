'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import Loading from '@/components/Loading'
import type { User, Session } from '@supabase/supabase-js' // Import Supabase types
import type { Profile } from '@/types/database' // Import Profile type

interface AuthProviderProps {
  user: User | null 
  session: Session | null 
  profile: Profile | null 
  children: React.ReactNode
}

export function AuthProvider({ user, session, profile, children }: AuthProviderProps) {
  // Get the action to set initial auth state, and the 'hydrated' status from the store
  const setInitialAuthState = useAuthStore((s) => s.setInitialAuthState)
  const storeHydrated = useAuthStore((s) => s.hydrated)
  const storeIsLoading = useAuthStore((s) => s.isLoading)
  const initialized = useRef(false) // Ref to track if initial props have been set

  if (process.env.NODE_ENV === 'development') {
    console.log('AuthProvider render: storeHydrated=', storeHydrated, 'storeIsLoading=', storeIsLoading);
  }

  useEffect(() => {
    // Only set initial server state if the store hasn't been hydrated yet
    // and this component instance hasn't initialized.
    // onAuthStateChange should handle updates post-hydration.
    if (!initialized.current && !storeHydrated) {
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthProvider useEffect (initial run, pre-hydration): Setting initial server props:', { user, session, profile })
      }
      // We pass the server props, but onAuthStateChange might update them shortly after hydration
      setInitialAuthState(user, session, profile)
      initialized.current = true
    } else if (storeHydrated && !initialized.current) {
      // If store is already hydrated when this runs (e.g., fast refresh, subsequent mount),
      // trust the hydrated state and don't overwrite with potentially stale server props.
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthProvider useEffect (initial run, post-hydration): Store already hydrated, skipping initial props set.')
      }
      initialized.current = true; // Mark as initialized to prevent re-running logic
    }
  }, [user, session, profile, setInitialAuthState, storeHydrated])

  // Show loading indicator if the store is still loading data (e.g., profile fetch)
  // OR if the store hasn't rehydrated from localStorage yet.
  if (storeIsLoading || !storeHydrated) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`AuthProvider: Rendering loading indicator (storeIsLoading: ${storeIsLoading}, storeHydrated: ${storeHydrated}).`)
    }
    return <Loading fullScreen />
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('AuthProvider: Store is hydrated and not loading. Rendering children.')
  }
  return <>{children}</>
} 