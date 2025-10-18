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

  // Simplified consistency check - allow transitional states
  useEffect(() => {
    if (hydrated && !isLoading) {
      // Be more lenient - only flag as inconsistent after a delay
      const hasInconsistentState = 
        (user && !session) || 
        (!user && session);
        
      if (hasInconsistentState) {
        const timeoutId = setTimeout(() => {
          setIsConsistent(false);
        }, 2000);
        return () => clearTimeout(timeoutId);
      } else {
        setIsConsistent(true);
      }
    }
  }, [user, session, isLoading, hydrated]);

  // Then handle redirection based on auth state
  useEffect(() => {
    // Wait until hydration and initial loading completes
    if (!hydrated || isLoading) {return;}
    
    // More lenient authentication check - focus on user presence
    const isAuthenticated = !!user;
    
    if (!isAuthenticated) {
      router.push('/auth?from=protected');
    }
    
    // Mark that we've checked authentication
    setCheckedAuth(true);
  }, [user, session, isLoading, hydrated, router]);

  return { 
    user, 
    profile, 
    session, 
    isLoading: isLoading || !hydrated || !checkedAuth, 
    hydrated, 
    isAuthenticated: !!user && hydrated && !isLoading
  };
}

// Hook for login/register pages - redirects to dashboard if already authenticated
export function useRedirectIfAuthenticated() {
  // IMPORTANT: Keep all hooks in the exact same order
  const { user, session, isLoading, hydrated, profile } = useAuthStore();
  const [isConsistent, setIsConsistent] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Simplified consistency check
  useEffect(() => {
    if (hydrated && !isLoading) {
      const hasInconsistentState = 
        (user && !session) || 
        (!user && session);
        
      if (hasInconsistentState) {
        const timeoutId = setTimeout(() => {
          setIsConsistent(false);
        }, 2000);
        return () => clearTimeout(timeoutId);
      } else {
        setIsConsistent(true);
      }
    }
  }, [user, session, isLoading, hydrated]);

  useEffect(() => {
    // Wait for hydration and initial load
    if (!hydrated || isLoading) {return;}
    
    // More lenient authentication check - focus on user presence
    const isAuthenticated = !!user;
    
    // Don't redirect authenticated users away from valid authenticated pages
    const authenticatedPaths = ['/dashboard', '/profile', '/settings', '/organizations', '/create', '/discover', '/people', '/projects', '/fundraising', '/onboarding'];
    if (isAuthenticated && pathname !== '/' && !authenticatedPaths.some(path => pathname.startsWith(path))) {
      router.push('/dashboard');
    }
  }, [user, session, isLoading, hydrated, router, pathname, profile]);

  return { 
    isLoading: isLoading || !hydrated, 
    hydrated,
    isAuthenticated: !!user && hydrated && !isLoading
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
  
  // Simplified consistency check - only flag as inconsistent if it's clearly an error state
  // Don't flag transitional states during normal auth flows
  useEffect(() => {
    if (authState.hydrated && !authState.isLoading) {
      // Only consider it truly inconsistent if this state persists
      // Allow transitional states during normal auth operations
      const hasInconsistentState = 
        (authState.user && !authState.session) || 
        (!authState.user && authState.session);
        
      if (hasInconsistentState) {
        // Wait longer before considering it inconsistent to allow auth flow to complete
        const timeoutId = setTimeout(() => {
          const currentState = useAuthStore.getState();
          const stillInconsistent = 
            (currentState.user && !currentState.session) || 
            (!currentState.user && currentState.session);
            
          if (stillInconsistent && currentState.hydrated && !currentState.isLoading) {
            setIsConsistent(false);
          } else {
            // State resolved itself, ensure consistency flag is correct
            setIsConsistent(true);
          }
        }, 2000); // Increased timeout to 2 seconds for auth flows to complete
        
        return () => clearTimeout(timeoutId);
      } else {
        setIsConsistent(true);
      }
    }
  }, [authState.user, authState.session, authState.hydrated, authState.isLoading]);
  
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

  // Be more lenient with authentication - allow user without session temporarily
  // This handles server-side scenarios where session might be null but user exists
  const isAuthenticated = authState.hydrated && !authState.isLoading && !!authState.user;

  return {
    ...authState,
    isAuthenticated,
    isConsistent,
    fixInconsistentState
  };
} 