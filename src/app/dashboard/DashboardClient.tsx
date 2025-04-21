'use client'

import { User } from '@supabase/supabase-js'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Profile } from '@/types/database'

interface DashboardClientProps {
  user: User | null
  profile: Profile | null
  children?: React.ReactNode
}

export default function DashboardClient({ user, profile, children }: DashboardClientProps) {
  return <DashboardLayout user={user} profile={profile}>{children}</DashboardLayout>
} 