'use client'

import { User } from '@supabase/supabase-js'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import DashboardContent from '@/components/dashboard/DashboardContent'
import { useProfile } from '@/hooks/useProfile'

interface DashboardClientProps {
  user: User
  fundingPages: any[]
  transactions: any[]
}

export default function DashboardClient({ user, fundingPages, transactions }: DashboardClientProps) {
  const { profile } = useProfile()

  return (
    <DashboardLayout user={user} profile={profile}>
      <DashboardContent />
    </DashboardLayout>
  )
} 