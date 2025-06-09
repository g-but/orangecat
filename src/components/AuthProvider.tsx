'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import Loading from '@/components/Loading';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AuthProviderProps {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  children: React.ReactNode;
}

export function AuthProvider({ user, session, profile, children }: AuthProviderProps) {
  const setInitialAuthState = useAuthStore((s) => s.setInitialAuthState);
  const storeHydrated = useAuthStore((s) => s.hydrated);
  // const storeIsLoading = useAuthStore((s) => s.isLoading); // No longer used for top-level loading
  const isInitialized = useRef(false);

  if (process.env.NODE_ENV === 'development') {
    console.log('AuthProvider render: storeHydrated=', storeHydrated, 'props=', {
      user,
      session,
      profile,
    });
  }

  useEffect(() => {
    // Initialize the store only once with the server-provided state.
    // Subsequent auth changes are handled by onAuthStateChange in the store itself.
    if (!isInitialized.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthProvider useEffect: Setting initial auth state from props.', {
          user,
          session,
          profile,
        });
      }
      setInitialAuthState(user, session, profile);
      isInitialized.current = true;
    }
  }, [user, session, profile, setInitialAuthState]);

  // Only show a full-screen loading indicator until the store is hydrated
  // from either server props (initial load) or persisted state (client-side navigation).
  if (!storeHydrated) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`AuthProvider: Rendering loading indicator (storeHydrated: ${storeHydrated})`);
    }
    // Add suppressHydrationWarning here if Loading component or its direct parent causes it
    return <div suppressHydrationWarning><Loading fullScreen /></div>;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('AuthProvider: Store is hydrated. Rendering children.');
  }
  return <>{children}</>;
} 