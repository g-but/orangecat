import { useAuthStore } from '@/store/auth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// Hook for protected routes - redirects to login if not authenticated
export function useRequireAuth() {
  // IMPORTANT: Keep all hooks in the exact same order
  const { user, session, profile, isLoading, hydrated } = useAuthStore();
  const [isConsistent, setIsConsistent] = useState(true);
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);

  // First check for inconsistent state
  useEffect(() => {
    if (hydrated && !isLoading) {
      const hasInconsistentState = 
        (user && !session) || 
        (!user && session);
        
      setIsConsistent(!hasInconsistentState);
    }
  }, [user, session, isLoading, hydrated]);

  // Then handle redirection based on auth state
  useEffect(() => {
    // Wait until hydration and initial loading completes
    if (!hydrated || isLoading) return;
    
    // If no auth or inconsistent state, redirect to login
    const isAuthenticated = isConsistent && !!user && !!session;
    
    if (!isAuthenticated) {
      router.push('/auth?from=protected');
    }
    
    // Mark that we've checked authentication
    setCheckedAuth(true);
  }, [user, session, isLoading, hydrated, router, isConsistent]);

  return { 
    user, 
    profile, 
    session, 
    isLoading: isLoading || !hydrated || !checkedAuth, 
    hydrated, 
    isAuthenticated: isConsistent && !!user && !!session
  };
}

// Hook for login/register pages - redirects to dashboard if already authenticated
export function useRedirectIfAuthenticated() {
  // IMPORTANT: Keep all hooks in the exact same order
  const { user, session, isLoading, hydrated, profile } = useAuthStore();
  const [isConsistent, setIsConsistent] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // First check for inconsistent state
  useEffect(() => {
    if (hydrated && !isLoading) {
      const hasInconsistentState = 
        (user && !session) || 
        (!user && session);
        
      setIsConsistent(!hasInconsistentState);
    }
  }, [user, session, isLoading, hydrated]);

  useEffect(() => {
    // Wait for hydration and initial load
    if (!hydrated || isLoading) return;
    
    // Only redirect if user is fully authenticated and not on dashboard/home
    const isAuthenticated = isConsistent && !!user && !!session;
    
    if (isAuthenticated && pathname !== '/dashboard' && pathname !== '/') {
      router.push('/dashboard');
    }
  }, [user, session, isLoading, hydrated, router, pathname, profile, isConsistent]);

  return { 
    isLoading: isLoading || !hydrated, 
    hydrated,
    isAuthenticated: isConsistent && !!user && !!session
  };
}

// General auth hook with consistency checks
export function useAuth() {
  // IMPORTANT: Keep all hooks in the exact same order
  const authState = useAuthStore();
  const [isConsistent, setIsConsistent] = useState(true);
  const router = useRouter(); // Always declare this hook third
  
  // Detect inconsistent state (one of user/session exists but not the other)
  useEffect(() => {
    if (authState.hydrated && !authState.isLoading) {
      const hasInconsistentState = 
        (authState.user && !authState.session) || 
        (!authState.user && authState.session);
        
      if (hasInconsistentState) {
        console.warn('useAuth - Inconsistent state detected:', {
          hasUser: !!authState.user,
          hasSession: !!authState.session
        });
        setIsConsistent(false);
      } else {
        setIsConsistent(true);
      }
    }
  }, [authState.user, authState.session, authState.hydrated, authState.isLoading]);
  
  // Debug logs for auth state
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('useAuth - Current auth state:', {
        hasUser: !!authState.user,
        hasSession: !!authState.session,
        hasProfile: !!authState.profile,
        isLoading: authState.isLoading,
        hydrated: authState.hydrated,
        isConsistent
      });
    }
  }, [authState, isConsistent]);

  // Simple function to fix inconsistent state - no auto-fix to avoid race conditions
  const fixInconsistentState = async () => {
    if (!authState.hydrated || authState.isLoading) {
      return;
    }

    console.warn('Manually fixing inconsistent auth state');
    
    try {
      // Force sign out to clean everything up
      await authState.signOut();
      
      // Redirect to auth page if on a protected route
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/dashboard') || 
          currentPath.startsWith('/profile') || 
          currentPath.startsWith('/settings')) {
        router.push('/auth');
      }
    } catch (error) {
      console.error('Error during auth state fix:', error);
    }
  };

  // Calculate isAuthenticated once based on all the state
  const isAuthenticated = isConsistent && !!authState.user && !!authState.session;

  return {
    ...authState,
    isAuthenticated,
    isConsistent,
    fixInconsistentState
  };
} 