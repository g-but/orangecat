'use client'

import { useRequireAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, hydrated } = useRequireAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && hydrated) {
      if (user && !profile) {
        console.log('DashboardLayout: User authenticated but profile missing, redirecting to /complete-profile')
        router.replace('/complete-profile')
      }
    }
  }, [user, profile, isLoading, hydrated, router])

  if (isLoading || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-tiffany-600 border-t-transparent" />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-tiffany-600 border-t-transparent" />
      </div>
    )
  }

  return <DashboardLayout user={user} profile={profile}>{children}</DashboardLayout>
} 