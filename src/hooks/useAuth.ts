import { useAuthStore } from '@/stores/auth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { logger } from '@/utils/logger'

// Throttle function to prevent excessive logging - increased delays
function useThrottledLog(logFn: () => void, delay: number = 10000) {
  const lastLogTime = useRef(0);
  
  return () => {
    const now = Date.now();
    if (now - lastLogTime.current >= delay) {
      logFn();
      lastLogTime.current = now;
    }
  };
}

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

// General auth hook with consistency checks - optimized to reduce excessive updates
export function useAuth() {
  // IMPORTANT: Keep all hooks in the exact same order
  const authState = useAuthStore();
  const [isConsistent, setIsConsistent] = useState(true);
  const router = useRouter(); // Always declare this hook third
  const lastLoggedState = useRef<string>('');
  
  // Throttled logging to prevent console spam - only log every 10 seconds for truly significant changes
  const throttledLog = useThrottledLog(() => {
    if (process.env.NODE_ENV === 'development') {
      // Create a signature of the current state to avoid duplicate logs
      const stateSignature = `${!!authState.user}-${!!authState.session}-${!!authState.profile}-${authState.isLoading}-${authState.hydrated}-${isConsistent}`;
      
      // Only log if state signature has changed significantly
      if (stateSignature !== lastLoggedState.current) {
        // Only log when there's a meaningful state change
        const isSignificantChange = 
          authState.hydrated && 
          (!authState.isLoading || 
           !isConsistent || 
           (authState.user && authState.session));
        
        if (isSignificantChange) {
          logger.debug('Significant auth state change', {
            hasUser: !!authState.user,
            hasSession: !!authState.session,
            hasProfile: !!authState.profile,
            isLoading: authState.isLoading,
            hydrated: authState.hydrated,
            isConsistent,
            stateChange: lastLoggedState.current ? `${lastLoggedState.current} → ${stateSignature}` : 'initial',
            timestamp: new Date().toISOString()
          });
          lastLoggedState.current = stateSignature;
        }
      }
    }
  }, 10000); // Increased to 10 seconds to greatly reduce spam
  
  // Detect inconsistent state (one of user/session exists but not the other)
  useEffect(() => {
    if (authState.hydrated && !authState.isLoading) {
      const hasInconsistentState = 
        (authState.user && !authState.session) || 
        (!authState.user && authState.session);
        
      if (hasInconsistentState !== !isConsistent) {
        if (hasInconsistentState) {
          logger.warn('Inconsistent auth state detected', {
            hasUser: !!authState.user,
            hasSession: !!authState.session
          }, 'Auth');
        }
        setIsConsistent(!hasInconsistentState);
      }
    }
  }, [authState.user, authState.session, authState.hydrated, authState.isLoading, isConsistent]);
  
  // Only log very significant auth state changes with much less frequency
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && authState.hydrated) {
      // Only call throttled log for critical state changes
      const shouldLog = 
        !authState.isLoading && (
          !isConsistent || 
          (authState.user && authState.session && authState.profile)
        );
      
      if (shouldLog) {
        throttledLog();
      }
    }
  }, [authState.user, authState.session, authState.profile, authState.isLoading, authState.hydrated, isConsistent, throttledLog]);

  // Simple function to fix inconsistent state - no auto-fix to avoid race conditions
  const fixInconsistentState = async () => {
    if (!authState.hydrated || authState.isLoading) {
      return;
    }

    logger.warn('Manually fixing inconsistent auth state', {}, 'Auth');
    
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
      logger.error('Error during auth state fix', { error: error instanceof Error ? error.message : String(error) }, 'Auth');
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