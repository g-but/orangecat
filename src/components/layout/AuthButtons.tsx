'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'
import UserProfileDropdown from '@/components/ui/UserProfileDropdown'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface AuthButtonsProps {
  className?: string
}

export default function AuthButtons({ className = '' }: AuthButtonsProps) {
  const { user, session, isLoading, hydrated, authError } = useAuth()

  // First check hydration
  if (!hydrated) {
    // Minimal loading indicator while hydrating
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    )
  }

  // Then check loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-tiffany-500" />
      </div>
    )
  }

  // If there's an auth error, treat as not authenticated
  if (authError) {
    // User is not authenticated due to error
    const isMobileNav = className.includes('flex-col')
    
    return (
      <div className={`flex items-center ${isMobileNav ? 'flex-col space-y-2 w-full' : 'space-x-2'} ${className}`}>
        <Link href="/auth?mode=login" className={isMobileNav ? 'w-full' : ''}>
          <Button 
            variant="ghost" 
            size="sm"
            className={`${isMobileNav ? 'w-full justify-center' : ''} min-h-[36px] text-sm`}
          >
            Log in
          </Button>
        </Link>
        <Link href="/auth?mode=register" className={isMobileNav ? 'w-full' : ''}>
          <Button 
            size="sm"
            className={`${isMobileNav ? 'w-full justify-center' : ''} min-h-[36px] text-sm`}
          >
            Get Started
          </Button>
        </Link>
      </div>
    )
  }

  // User is authenticated ONLY if we have BOTH a user AND a session
  // This prevents showing the dropdown with stale data
  if (user && session) {
    return <UserProfileDropdown variant="advanced" />
  }

  // User is not authenticated
  // Check if this is a mobile nav (column layout)
  const isMobileNav = className.includes('flex-col')

  return (
    <div className={`flex items-center ${isMobileNav ? 'flex-col space-y-2 w-full' : 'space-x-2'} ${className}`}>
      <Link href="/auth?mode=login" className={isMobileNav ? 'w-full' : ''}>
        <Button 
          variant="ghost" 
          size="sm"
          className={`${isMobileNav ? 'w-full justify-center' : ''} min-h-[36px] text-sm`}
        >
          Log in
        </Button>
      </Link>
      <Link href="/auth?mode=register" className={isMobileNav ? 'w-full' : ''}>
        <Button 
          size="sm"
          className={`${isMobileNav ? 'w-full justify-center' : ''} min-h-[36px] text-sm`}
        >
          Get Started
        </Button>
      </Link>
    </div>
  )
} 