'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Plus, User, Compass, BookOpen, Rocket } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useBottomNavScroll } from '@/hooks/useHeaderScroll'
import { useComposer } from '@/contexts/ComposerContext'
import { cn } from '@/lib/utils'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, hydrated } = useAuth()
  const { shouldBeTransparent, shouldBeSmall } = useBottomNavScroll()
  const { openComposer } = useComposer()

  // Don't render until auth is hydrated to prevent layout shift
  if (!hydrated) {
    return null
  }

  // Don't show on auth pages or specific routes
  if (!pathname ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/assets') ||
      pathname.startsWith('/events') ||
      pathname.startsWith('/organizations') ||
      pathname.startsWith('/funding')) {
    return null
  }

  // Context-aware navigation based on current route
  const isAuthenticatedRoute = user && (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/timeline') ||
    pathname.startsWith('/community') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/profiles') ||
    pathname.startsWith('/people') ||
    pathname.startsWith('/projects')
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
      label: 'Timeline',
      href: '/timeline',
      active: pathname?.startsWith('/timeline')
    },
    {
      icon: Plus,
      label: 'Post',
      href: '/timeline?compose=true',
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
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 border-t",
        "transition-all duration-300 ease-in-out",
        shouldBeTransparent
          ? "bg-white/20 backdrop-blur-sm border-transparent"
          : "bg-white/95 backdrop-blur-md",
        isAuthenticatedRoute ? "border-orange-200/50 shadow-lg" : "border-gray-200/50"
      )}
      style={{
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transform: shouldBeSmall ? 'scale(0.85) translateY(4px)' : 'scale(1) translateY(0)',
        opacity: shouldBeTransparent ? 0.7 : 1,
      }}
    >
        {/* Primary button spacer - creates space above nav for floating button */}
        <div className={cn("transition-all duration-300", shouldBeSmall ? "h-1" : "h-2")} aria-hidden="true" />

        <nav
          className={cn(
            "flex items-center justify-around transition-all duration-300",
            shouldBeSmall ? "px-1 py-1" : "px-2 py-2"
          )}
          style={{
            minHeight: shouldBeSmall ? '48px' : '64px',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))'
          }}
          role="navigation"
          aria-label="Mobile navigation"
        >
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = item.active

            return (
              <button
                key={`${item.href}-${index}`}
                onClick={(e) => {
                  e.preventDefault()
                  // For Plus button, open composer immediately
                  if (item.primary && item.href.includes('compose=true')) {
                    openComposer()
                    // Also navigate to timeline in background (for URL consistency)
                    router.push('/timeline?compose=true')
                  } else {
                    router.push(item.href)
                  }
                }}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 rounded-lg',
                  'transition-all duration-200',
                  'touch-manipulation select-none',
                  '-webkit-tap-highlight-color-transparent',
                  'active:scale-95 active:bg-gray-100',
                  isActive && (isAuthenticatedRoute ? 'text-orange-600' : 'text-tiffany-600'),
                  !isActive && 'text-gray-500',
                  item.primary && 'relative',
                  shouldBeSmall ? 'min-h-[48px] gap-0.5' : 'min-h-[56px] gap-1'
                )}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                type="button"
              >
                {item.primary ? (
                  <div
                    className={cn(
                      "absolute flex items-center justify-center rounded-full shadow-lg",
                      "transition-all duration-300 hover:scale-105 active:scale-95",
                      isAuthenticatedRoute
                        ? "bg-gradient-to-r from-orange-500 to-orange-600"
                        : "bg-gradient-to-r from-tiffany-500 to-tiffany-600"
                    )}
                    style={{
                      width: shouldBeSmall ? '48px' : '56px',
                      height: shouldBeSmall ? '48px' : '56px',
                      top: shouldBeSmall ? '-24px' : '-28px'
                    }}
                  >
                    <Icon 
                      className={cn(
                        "text-white transition-all duration-300",
                        shouldBeSmall ? "w-5 h-5" : "w-6 h-6"
                      )} 
                      strokeWidth={2} 
                    />
                  </div>
                ) : (
                  <>
                    <Icon
                      className={cn(
                        'transition-all duration-300',
                        shouldBeSmall ? 'w-5 h-5' : 'w-6 h-6',
                        isActive && 'fill-current scale-110'
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span
                      className={cn(
                        'font-medium transition-all duration-300 leading-tight',
                        shouldBeSmall 
                          ? 'text-[9px]' 
                          : 'text-[10px]',
                        isActive && 'font-semibold'
                      )}
                    >
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
