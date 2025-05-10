'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import Loading from '@/components/Loading'
import type { User, Session } from '@supabase/supabase-js' // Import Supabase types
import type { Profile } from '@/store/auth' // Import Profile type

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
  const initialized = useRef(false) // Ref to track if initial props have been set

  if (process.env.NODE_ENV === 'development') {
    console.log('AuthProvider render: current storeHydrated value is', storeHydrated);
  }

  useEffect(() => {
    // This effect runs on the client after mount.
    // It's responsible for putting the initial server-provided auth state
    // into the Zustand store if it hasn't been done yet by this component instance.
    // onAuthStateChange in auth.ts will subsequently keep it in sync with Supabase client events.
    if (!initialized.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthProvider useEffect (initial run): Hydrating with server props:', { user, session, profile })
      }
      setInitialAuthState(user, session, profile)
      initialized.current = true
    }
    // If server-side props (user, session, profile) change due to a full page navigation
    // where RootLayout re-fetches and passes new props, this effect *should* reflect those.
    // However, the primary driver for client-side auth changes post-initial load is onAuthStateChange.
    // To handle cases where server props genuinely change and need to force-update the store
    // *through AuthProvider* (e.g. if onAuthStateChange is bypassed or for some specific SSR->client sync scenario),
    // we might need a more nuanced condition than just initialized.current.
    // For now, this ensures the *first* set of server props are applied once by this component.
    // A potential refinement: if props *actually* change and differ from store, then re-apply.
    // But let's keep it simple first to address the immediate loading issue.
    // The dependencies [user, session, profile, setInitialAuthState] mean this effect *will* re-run
    // if these props/functions change identity. The initialized.current flag prevents
    // setInitialAuthState from being called repeatedly by *this specific effect hook* after its first successful execution.
  }, [user, session, profile, setInitialAuthState])

  // Show loading state while hydrating
  if (!storeHydrated) {
    if (process.env.NODE_ENV === 'development') {
      console.log('AuthProvider: Store not hydrated yet. Rendering loading indicator.')
    }
    return <Loading fullScreen />
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('AuthProvider: Store is hydrated. Rendering children.')
  }
  return <>{children}</>
} 