'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, Plus, User, Compass, BookOpen, Rocket, Users as UsersIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [showPostModal, setShowPostModal] = useState(false)

  // Don't show on auth pages or specific routes
  if (pathname?.startsWith('/auth') ||
      pathname?.startsWith('/settings') ||
      pathname?.startsWith('/assets') ||
      pathname?.startsWith('/events') ||
      pathname?.startsWith('/organizations') ||
      pathname?.startsWith('/funding')) {
    return null
  }

  // Context-aware navigation based on current route
  const isAuthenticatedRoute = user && (
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/journey') ||
    pathname?.startsWith('/community') ||
    pathname?.startsWith('/profile') ||
    pathname?.startsWith('/people') ||
    pathname?.startsWith('/projects')
  )

  const navItems = isAuthenticatedRoute ? [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard',
      active: pathname === '/dashboard'
    },
    {
      icon: BookOpen,
      label: 'Journey',
      href: '/journey',
      active: pathname?.startsWith('/journey')
    },
    {
      icon: Plus,
      label: 'Post',
      href: '/journey?compose=true',
      active: false,
      primary: true
    },
    {
      icon: Rocket,
      label: 'Projects',
      href: '/dashboard/projects',
      active: pathname?.startsWith('/dashboard/projects') || (pathname?.startsWith('/projects') && pathname !== '/projects/create')
    },
    {
      icon: User,
      label: 'Profile',
      href: '/profile',
      active: pathname?.startsWith('/profile')
    }
  ] : [
    {
      icon: Home,
      label: 'Home',
      href: user ? '/dashboard' : '/',
      active: user ? pathname === '/dashboard' : pathname === '/'
    },
    {
      icon: Compass,
      label: 'Discover',
      href: '/discover',
      active: pathname === '/discover'
    },
    {
      icon: Plus,
      label: 'Create',
      href: '/projects/create',
      active: pathname?.startsWith('/projects/create'),
      primary: true
    },
    {
      icon: User,
      label: 'Profile',
      href: user ? '/profile' : '/auth',
      active: pathname?.startsWith('/profile')
    }
  ]

  return (
    <div className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t safe-area-padding-bottom",
      isAuthenticatedRoute ? "border-orange-200 shadow-lg" : "border-gray-200"
    )}>
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200',
                'tap-highlight-none active:scale-95',
                item.active && (isAuthenticatedRoute ? 'text-orange-600' : 'text-tiffany-600'),
                !item.active && 'text-gray-500 hover:text-gray-700',
                item.primary && 'relative'
              )}
            >
              {item.primary ? (
                <div className={cn(
                  "absolute -top-6 flex items-center justify-center w-14 h-14 rounded-full shadow-lg",
                  isAuthenticatedRoute
                    ? "bg-gradient-to-r from-orange-500 to-orange-600"
                    : "bg-gradient-to-r from-tiffany-500 to-tiffany-600"
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <>
                  <Icon className={cn(
                    'w-6 h-6',
                    item.active && 'fill-current'
                  )} />
                  <span className={cn(
                    'text-xs font-medium',
                    item.active && 'font-semibold'
                  )}>
                    {item.label}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
