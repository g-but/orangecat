'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import Loading from '@/components/Loading'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return <Loading fullScreen message="Loading your profile..." />
  }

  if (!user) {
    return null
  }

  return <>{children}</>
} 