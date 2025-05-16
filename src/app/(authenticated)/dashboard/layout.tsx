'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import ActualDashboardLayout from '@/components/dashboard/DashboardLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, hydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return

    if (!isLoading && !user) {
      console.log('DashboardLayout Wrapper: No user, redirecting to /auth')
      router.push('/auth')
    }
    // No longer redirecting if user exists but profile is missing.
    // The ActualDashboardLayout or its children (dashboard page) will handle this.
  }, [user, isLoading, hydrated, router])

  if (isLoading || !hydrated) {
    return <Loading fullScreen />
  }

  if (!user) {
    return <Loading fullScreen />
  }
  
  // User is authenticated, profile may or may not be complete.
  // Pass user and profile to the ActualDashboardLayout which contains the UI structure.
  return <ActualDashboardLayout user={user} profile={profile}>{children}</ActualDashboardLayout>
} 