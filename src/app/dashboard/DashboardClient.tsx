'use client'

import { User } from '@supabase/supabase-js'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Profile } from '@/types/database'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface DashboardClientProps {
  user: User | null
  profile: Profile | null
  children?: React.ReactNode
}

export default function DashboardClient({ user, profile, children }: DashboardClientProps) {
  const router = useRouter()

  useEffect(() => {
    if (!user || !profile) {
      router.push('/auth/signin')
    }
  }, [user, profile, router])

  if (!user || !profile) {
    return null
  }

  return <DashboardLayout user={user} profile={profile}>{children}</DashboardLayout>
} 