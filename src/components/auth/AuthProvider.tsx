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
  const setInitialAuthState = useAuthStore((s) => s.setInitialAuthState)
  const storeHydrated = useAuthStore((s) => s.hydrated)
  const storeIsLoading = useAuthStore((s) => s.isLoading)
  // Use ref to ensure initial state is set only once *per mount*, 
  // but deferring the actual state setting logic to Zustand's hydration/onAuthStateChange
  const isInitialized = useRef(false)

  if (process.env.NODE_ENV === 'development') {
    console.log('AuthProvider render: storeHydrated=', storeHydrated, 'storeIsLoading=', storeIsLoading);
  }

  useEffect(() => {
    // This effect primarily exists to ensure the store hydration logic
    // in auth.ts (onAuthStateChange) has a chance to run.
    // We mark initialized here, but don't force server state.
    if (!isInitialized.current) {
       if (process.env.NODE_ENV === 'development') {
         console.log('AuthProvider useEffect: Marking as initialized. Hydration/onAuthStateChange handles state.');
       }
       isInitialized.current = true;
       // If needed, trigger a re-check or initial load if onAuthStateChange hasn't fired yet.
       // However, the listener should handle this automatically.
    }
    // Dependencies removed to ensure this runs only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading indicator primarily based on store hydration status.
  // If hydrated, but isLoading is true (e.g., profile fetch), it will also show.
  if (!storeHydrated || storeIsLoading) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`AuthProvider: Rendering loading indicator (storeHydrated: ${storeHydrated}, storeIsLoading: ${storeIsLoading}).`)
    }
    return <Loading fullScreen />
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('AuthProvider: Store is hydrated and not loading. Rendering children.')
  }
  return <>{children}</>
} 