'use client'

import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types/database'
import React from 'react'
import { useRouter } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: User | null
  profile: Profile | null
}

export default function DashboardLayout({ children, user, profile }: DashboardLayoutProps) {
  const router = useRouter()

  if (!user) {
    router.push('/auth?mode=login')
    return null
  }

  return <>{children}</>
} 