'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import Loading from '@/components/Loading'
import type { User, Session } from '@supabase/supabase-js' // Import Supabase types
import type { Profile } from '@/types/database' // Import Profile type
import supabase from '@/services/supabase/client'

interface AuthProviderProps {
  user: User | null 
  session: Session | null 
  profile: Profile | null 
  children: React.ReactNode
}

export function AuthProvider({ user, session, profile, children }: AuthProviderProps) {
  const setInitialAuthState = useAuthStore((s) => s.setInitialAuthState)
  const hydrated = useAuthStore((s) => s.hydrated)
  const clear = useAuthStore((s) => s.clear)
  const setAuthError = useAuthStore((s) => s.setAuthError)

  // initialise once
  useEffect(() => {
    setInitialAuthState(user, session, profile)
  }, [user, session, profile, setInitialAuthState])

  // After hydration, always check Supabase for a valid session
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    async function checkSession() {
      try {
        // Use getUser() for security - it validates with the server
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('AuthProvider: No valid authenticated user found after hydration, clearing store.', { error });
          }
          setAuthError('Could not connect to authentication service. Please check your internet connection or try again later.');
          clear();
        } else {
          setAuthError(null); // Clear any previous error
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('AuthProvider: Error checking user authentication after hydration:', err);
        }
        setAuthError('Could not connect to authentication service. Please check your internet connection or try again later.');
        clear();
      }
    }
    checkSession();
    return () => { cancelled = true; };
  }, [hydrated, clear, setAuthError]);

  // While zustand re-hydrates render nothing (fast)
  if (!hydrated) return <Loading fullScreen />

  return <>{children}</>
} 