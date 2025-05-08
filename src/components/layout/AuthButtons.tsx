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
  const { user, isLoading, hydrated } = useAuth()

  if (!hydrated) {
    // Optionally, show a loading spinner or nothing while hydrating
    return (
      <div className={`flex items-center ${className}`} />
    )
  }

  if (isLoading) {
    return (
      <div className={`flex items-center ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-tiffany-500" />
      </div>
    )
  }

  if (user) {
    return <UserProfileDropdown />
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <Link href="/auth?mode=login">
        <Button variant="ghost">Log in</Button>
      </Link>
      <Link href="/auth?mode=signup">
        <Button>Get Started</Button>
      </Link>
    </div>
  )
} 