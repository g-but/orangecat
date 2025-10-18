'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import IntelligentOnboarding from '@/components/onboarding/IntelligentOnboarding'
import Loading from '@/components/Loading'

export default function OnboardingPage() {
  const { user, profile, isLoading, hydrated, session } = useAuth()
  const router = useRouter()

  // Redirect logic
  useEffect(() => {
    if (typeof window === 'undefined') {return}

    if (hydrated && !isLoading && !user) {
      router.push('/auth')
      return
    }

    // If user already has campaigns, skip onboarding and go to dashboard
    if (profile && hydrated && !isLoading) {
      // Check if user has any campaigns (this would need to be implemented)
      // For now, we'll assume new users don't have campaigns
      // setIsRedirecting(false)
    }
  }, [user, hydrated, isLoading, profile, router])

  // Show loading state
  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Setting up your account..." />
  }

  if (!user) {
    return <Loading fullScreen message="Redirecting to login..." />
  }

  return <IntelligentOnboarding />
}
