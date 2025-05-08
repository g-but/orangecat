'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import Loading from '@/components/Loading'

interface AuthProviderProps {
  user: any // Consider using more specific types from Supabase if available
  session: any // Consider using more specific types from Supabase if available
  profile: any // Consider using your Profile type if defined
  children: React.ReactNode
}

export function AuthProvider({ user, session, profile, children }: AuthProviderProps) {
  // Get the action to set initial auth state, and the 'hydrated' status from the store
  const setInitialAuthState = useAuthStore((s) => s.setInitialAuthState)
  const storeHydrated = useAuthStore((s) => s.hydrated)

  useEffect(() => {
    // This effect runs on the client after mount, and if server props change.
    // It's responsible for putting the server-provided auth state into the Zustand store.
    console.log('AuthProvider useEffect: Hydrating with server props:', { user, session, profile })
    setInitialAuthState(user, session, profile)
  }, [user, session, profile, setInitialAuthState])

  // Show loading state while hydrating
  if (!storeHydrated) {
    console.log('AuthProvider: Store not hydrated yet. Rendering loading indicator.')
    return <Loading fullScreen />
  }

  console.log('AuthProvider: Store is hydrated. Rendering children.')
  return <>{children}</>
} 