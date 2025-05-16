'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Loading from '@/components/Loading'

interface RoleManagementProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user'
}

export default function RoleManagement({ children, requiredRole = 'user' }: RoleManagementProps) {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  
  // Check if user is admin based on email domain - you can adjust this logic
  // to match your specific admin identification method
  const isAdmin = user?.email?.endsWith('@orangecat.ch') || 
                 user?.email === 'admin@example.com' ||
                 user?.app_metadata?.role === 'admin'

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth?from=protected')
    } else if (!isLoading && requiredRole === 'admin' && !isAdmin) {
      router.push('/')
    }
  }, [user, isAdmin, isLoading, router, requiredRole])

  if (isLoading) {
    return <Loading />
  }

  if (!user || (requiredRole === 'admin' && !isAdmin)) {
    return null
  }

  return <>{children}</>
} 