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

  // Set up auth state listener for real-time updates (SINGLE SOURCE OF TRUTH)
  useEffect(() => {
    if (!hydrated) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // REMOVED: console.log statement for security
        
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            // REMOVED: console.log statement for security
            setInitialAuthState(session.user, session, null);
            setAuthError(null);
            
            // CRITICAL: Fetch profile after auth state is set
            // REMOVED: console.log statement for security
            const { fetchProfile } = useAuthStore.getState();
            fetchProfile().then(() => {
              if (process.env.NODE_ENV === 'development') console.log('✅ AuthProvider: Profile fetched successfully');
            }).catch(error => {
            });
          }
        } else if (event === 'SIGNED_OUT') {
          // REMOVED: console.log statement for security
          clear();
          setAuthError(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // REMOVED: console.log statement for security
          // Don't clear profile on token refresh - keep existing profile data
          const currentProfile = useAuthStore.getState().profile;
          setInitialAuthState(session.user, session, currentProfile);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [hydrated, clear, setAuthError, setInitialAuthState]);

  // While zustand re-hydrates render nothing (fast)
  if (!hydrated) return <Loading fullScreen />

  return <>{children}</>
} 