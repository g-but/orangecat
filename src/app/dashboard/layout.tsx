'use client'

import { useRequireAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useRequireAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-tiffany-600 border-t-transparent" />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return <DashboardLayout user={user} profile={profile}>{children}</DashboardLayout>
} 