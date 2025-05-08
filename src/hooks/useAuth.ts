import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useRequireAuth() {
  const { user, profile, isLoading, hydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Debug logs for auth state
    console.log('useRequireAuth - Auth state:', { user, isLoading, hydrated })

    if (!isLoading && hydrated && !user) {
      console.log('useRequireAuth - Redirecting to auth page')
      router.push('/auth?from=protected')
    }
  }, [user, isLoading, hydrated, router])

  return { user, profile, isLoading, hydrated }
}

export function useRedirectIfAuthenticated() {
  const { session, isLoading, hydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Debug logs for auth state
    console.log('useRedirectIfAuthenticated - Auth state:', { session, isLoading, hydrated })

    if (!isLoading && hydrated && session) {
      console.log('useRedirectIfAuthenticated - Redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [session, isLoading, hydrated, router])

  return { isLoading, hydrated }
}

// Re-export useAuthStore for convenience
export function useAuth() {
  const authState = useAuthStore()
  
  // Debug logs for auth state
  useEffect(() => {
    console.log('useAuth - Current auth state:', {
      user: authState.user,
      session: authState.session,
      profile: authState.profile,
      isLoading: authState.isLoading,
      hydrated: authState.hydrated
    })
  }, [authState])

  return authState
} 