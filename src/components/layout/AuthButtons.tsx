'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'
import UserProfileDropdown from '@/components/auth/UserProfileDropdown'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface AuthButtonsProps {
  className?: string
}

export default function AuthButtons({ className = '' }: AuthButtonsProps) {
  const { user, session, isLoading, hydrated } = useAuth()

  // First check hydration
  if (!hydrated) {
    // Minimal loading indicator while hydrating
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    )
  }

  // Then check loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-tiffany-500" />
      </div>
    )
  }

  // User is authenticated if we have a user OR a session
  if (user || session) {
    return <UserProfileDropdown />
  }

  // User is not authenticated
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <Link href="/auth?mode=login">
        <Button variant="ghost">Log in</Button>
      </Link>
      <Link href="/auth?mode=register">
        <Button>Get Started</Button>
      </Link>
    </div>
  )
} 