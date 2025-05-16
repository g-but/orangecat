import { useAuthStore } from '@/store/auth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function useRequireAuth() {
  const { user, profile, isLoading, hydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Debug logs for auth state
    if (process.env.NODE_ENV === 'development') {
      console.log('useRequireAuth - Auth state:', { user, isLoading, hydrated })
    }

    if (hydrated && !isLoading && !user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('useRequireAuth - Redirecting to auth page')
      }
      router.push('/auth?from=protected')
    }
  }, [user, isLoading, hydrated, router])

  return { user, profile, isLoading, hydrated }
}

export function useRedirectIfAuthenticated() {
  const { session, isLoading, hydrated, profile } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Debug logs for auth state
    if (process.env.NODE_ENV === 'development') {
      console.log('useRedirectIfAuthenticated - Auth state:', { session, isLoading, hydrated, profile })
    }

    // Only redirect if we're ready and on a page that should redirect authenticated users
    if (hydrated && !isLoading && session && pathname !== '/dashboard' && pathname !== '/') {
      // Ensure we have a profile before redirecting
      if (profile) {
        if (process.env.NODE_ENV === 'development') {
          console.log('useRedirectIfAuthenticated - Redirecting to dashboard')
        }
        router.push('/dashboard')
      }
    }
  }, [session, isLoading, hydrated, router, pathname, profile])

  return { isLoading, hydrated }
}

// Re-export useAuthStore for convenience
export function useAuth() {
  const authState = useAuthStore()
  
  // Debug logs for auth state
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('useAuth - Current auth state:', {
        user: authState.user,
        session: authState.session,
        profile: authState.profile,
        isLoading: authState.isLoading,
        hydrated: authState.hydrated
      })
    }
  }, [authState])

  return authState
} 