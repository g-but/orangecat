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
  const hydrated = useAuthStore((s) => s.hydrated)

  // initialise once
  useEffect(() => {
    setInitialAuthState(user, session, profile)
  }, [user, session, profile, setInitialAuthState])

  // While zustand re-hydrates render nothing (fast)
  if (!hydrated) return <Loading fullScreen />

  return <>{children}</>
} 