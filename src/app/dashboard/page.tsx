'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tiffany-500" />
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Additional dashboard content can be added here */}
      </div>
    </DashboardLayout>
  )
} 