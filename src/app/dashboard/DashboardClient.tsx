'use client'

import { User } from '@supabase/supabase-js'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface DashboardClientProps {
  user: User
  fundingPages: any[]
  transactions: any[]
}

export default function DashboardClient({ user, fundingPages, transactions }: DashboardClientProps) {
  return <DashboardLayout user={user} fundingPages={fundingPages} transactions={transactions} />
} 