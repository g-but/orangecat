'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, User, Compass, BookOpen, Rocket } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBottomNavScroll } from '@/hooks/useHeaderScroll';
import { useComposer } from '@/contexts/ComposerContext';
import { cn } from '@/lib/utils';
import { isAuthenticatedRoute, getRouteContext, ROUTE_CONTEXTS, ROUTES } from '@/config/routes';

const MobileBottomNav = React.memo(function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { shouldBeTransparent, shouldBeSmall } = useBottomNavScroll();
  const { openComposer } = useComposer();

  // Don't render until auth is hydrated to prevent layout shift
  if (!hydrated) {
    return null;
  }

  // Don't render if no pathname
  if (!pathname) {
    return null;
  }

  // Don't show on auth pages or specific routes that shouldn't have bottom nav
  const routeContext = getRouteContext(pathname);
  const hiddenRoutes = [
    ...ROUTE_CONTEXTS.auth,
    '/settings',
    '/assets',
    '/events',
    '/organizations',
    '/funding',
  ];
  
  if (hiddenRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return null;
  }

  // Context-aware navigation based on current route
  // Use centralized route detection instead of hardcoded pathname checks
  const isAuthRoute = isAuthenticatedRoute(pathname) || routeContext === 'contextual';
  // For home page, check user state to determine if showing authenticated nav
  const isAuthenticatedRouteContext = isAuthRoute || (user && pathname === ROUTES.HOME);

  // Use centralized route constants instead of hardcoded strings
  const navItems = isAuthenticatedRouteContext
    ? [
        {
          icon: Home,
          label: 'Dashboard',
          href: ROUTES.DASHBOARD.HOME,
          active: pathname === ROUTES.DASHBOARD.HOME || pathname.startsWith(`${ROUTES.DASHBOARD.HOME}/`),
        },
        {
          icon: BookOpen,
          label: 'Timeline',
          href: ROUTES.TIMELINE,
          active: pathname?.startsWith(ROUTES.TIMELINE),
        },
        {
          icon: Plus,
          label: 'Post',
          href: `${ROUTES.TIMELINE}?compose=true`,
          active: false,
          primary: true,
        },
        {
          icon: Rocket,
          label: 'Projects',
          href: ROUTES.DASHBOARD.PROJECTS,
          active:
            pathname?.startsWith(ROUTES.DASHBOARD.PROJECTS) ||
            (pathname?.startsWith(ROUTES.PROJECTS.LIST) && pathname !== ROUTES.PROJECTS.CREATE),
        },
        {
          icon: User,
          label: 'Profile',
          href: ROUTES.PROFILE.EDIT,
          active: pathname?.startsWith('/profile') || pathname?.startsWith('/profiles'),
        },
      ]
    : [
        {
          icon: Home,
          label: 'Home',
          href: user ? ROUTES.DASHBOARD.HOME : ROUTES.HOME,
          active: user ? pathname === ROUTES.DASHBOARD.HOME : pathname === ROUTES.HOME,
        },
        {
          icon: Compass,
          label: 'Discover',
          href: ROUTES.DISCOVER,
          active: pathname === ROUTES.DISCOVER,
        },
        {
          icon: Plus,
          label: 'Create',
          href: ROUTES.PROJECTS.CREATE,
          active: pathname?.startsWith(ROUTES.PROJECTS.CREATE),
          primary: true,
        },
        {
          icon: User,
          label: 'Profile',
          href: user ? ROUTES.PROFILE.EDIT : ROUTES.AUTH,
          active: pathname?.startsWith('/profile') || pathname?.startsWith('/profiles'),
        },
      ];

  return (
    <div
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 border-t',
        'transition-all duration-300 ease-in-out',
        shouldBeTransparent
          ? 'bg-white/20 backdrop-blur-sm border-transparent'
          : 'bg-white/95 backdrop-blur-md',
        isAuthenticatedRouteContext ? 'border-orange-200/50 shadow-lg' : 'border-gray-200/50'
      )}
      style={{
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transform: shouldBeSmall ? 'scale(0.85) translateY(4px)' : 'scale(1) translateY(0)',
        opacity: shouldBeTransparent ? 0.7 : 1,
      }}
    >
      {/* Primary button spacer - creates space above nav for floating button */}
      <div
        className={cn('transition-all duration-300', shouldBeSmall ? 'h-1' : 'h-2')}
        aria-hidden="true"
      />

      <nav
        className={cn(
          'flex items-center justify-around transition-all duration-300',
          shouldBeSmall ? 'px-1 py-1' : 'px-2 py-2'
        )}
        style={{
          minHeight: shouldBeSmall ? '48px' : '64px',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))',
        }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <button
              key={`${item.href}-${index}`}
              onClick={e => {
                e.preventDefault();
                // For Plus button, open composer immediately
                if (item.primary && item.href.includes('compose=true')) {
                  openComposer();
                  // Also navigate to timeline in background (for URL consistency)
                  router.push(`${ROUTES.TIMELINE}?compose=true`);
                } else {
                  router.push(item.href);
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center flex-1 rounded-lg',
                'transition-all duration-200',
                'touch-manipulation select-none',
                '-webkit-tap-highlight-color-transparent',
                'active:scale-95 active:bg-gray-100',
                isActive && (isAuthenticatedRouteContext ? 'text-orange-600' : 'text-tiffany-600'),
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
                    'absolute flex items-center justify-center rounded-full shadow-lg',
                    'transition-all duration-300 hover:scale-105 active:scale-95',
                    isAuthenticatedRouteContext
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                      : 'bg-gradient-to-r from-tiffany-500 to-tiffany-600'
                  )}
                  style={{
                    width: shouldBeSmall ? '48px' : '56px',
                    height: shouldBeSmall ? '48px' : '56px',
                    top: shouldBeSmall ? '-24px' : '-28px',
                  }}
                >
                  <Icon
                    className={cn(
                      'text-white transition-all duration-300',
                      shouldBeSmall ? 'w-5 h-5' : 'w-6 h-6'
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
                      shouldBeSmall ? 'text-[9px]' : 'text-[10px]',
                      isActive && 'font-semibold'
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';

export default MobileBottomNav;
