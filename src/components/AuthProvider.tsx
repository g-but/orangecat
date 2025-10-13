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
  const isInitialized = useRef(false);

  if (process.env.NODE_ENV === 'development') {
    // REMOVED: console.log statement for security
  }

  useEffect(() => {
    // Initialize the store only once with the server-provided state.
    if (!isInitialized.current) {
      if (process.env.NODE_ENV === 'development') {
        // REMOVED: console.log statement for security
      }
      setInitialAuthState(user, session, profile);
      isInitialized.current = true;
    }
  }, [user, session, profile, setInitialAuthState]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (!storeHydrated) {
      const timeout = setTimeout(() => {
        // REMOVED: console.log statement for security
        // Force hydration immediately if not hydrated (reduced timeout)
        const store = useAuthStore.getState();
        if (!store.hydrated) {
          store.setInitialAuthState(user, session, profile);
        }
      }, 100); // FIXED: Much shorter timeout (100ms)

      return () => clearTimeout(timeout);
    }
    return () => {}; // Return empty cleanup function when hydrated
  }, [storeHydrated, user, session, profile]);

  // Show loading only briefly, not indefinitely
  if (!storeHydrated) {
    if (process.env.NODE_ENV === 'development') {
      // REMOVED: console.log statement for security
    }
    return <div suppressHydrationWarning><Loading fullScreen /></div>;
  }

  if (process.env.NODE_ENV === 'development') {
    // REMOVED: console.log statement for security
  }
  return <>{children}</>;
} 