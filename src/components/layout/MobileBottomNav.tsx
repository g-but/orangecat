'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, Plus, User, Compass } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  // Don't show on auth pages or authenticated routes (they have their own navigation)
  if (pathname?.startsWith('/auth') ||
      pathname?.startsWith('/dashboard') ||
      pathname?.startsWith('/profile') ||
      pathname?.startsWith('/settings') ||
      pathname?.startsWith('/assets') ||
      pathname?.startsWith('/people') ||
      pathname?.startsWith('/events') ||
      pathname?.startsWith('/organizations') ||
      pathname?.startsWith('/projects') ||
      pathname?.startsWith('/funding')) {
    return null
  }

  const navItems = [
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
      href: '/create',
      active: pathname?.startsWith('/create'),
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-padding-bottom">
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
                item.active && 'text-tiffany-600',
                !item.active && 'text-gray-500 hover:text-gray-700',
                item.primary && 'relative'
              )}
            >
              {item.primary ? (
                <div className="absolute -top-6 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-tiffany-500 to-tiffany-600 shadow-lg">
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
