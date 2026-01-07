'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, User, Compass, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBottomNavScroll } from '@/hooks/useHeaderScroll';
import { useComposer } from '@/contexts/ComposerContext';
import { cn } from '@/lib/utils';
import { getRouteContext, ROUTE_CONTEXTS, ROUTES } from '@/config/routes';
import { getContextualCreateAction } from '@/lib/navigation/contextual-create';
import { MobileCreateSheet } from '@/components/create/MobileCreateSheet';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

const MobileBottomNav = React.memo(function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { shouldBeTransparent, shouldBeSmall } = useBottomNavScroll();
  const { openComposer } = useComposer();
  const [showCreateSheet, setShowCreateSheet] = useState(false);

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

  // Get contextual create action for the "+" button
  const createAction = getContextualCreateAction(pathname);

  // Authenticated users ALWAYS see the same 5 items for consistency
  // Non-authenticated users see simplified nav
  const isAuthenticated = !!user;

  // Navigation items - consistent for authenticated users regardless of route
  const navItems = isAuthenticated
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
          label: createAction.label,
          href: createAction.href,
          active: false,
          primary: true,
          createAction, // Pass the action for the click handler
        },
        {
          icon: ENTITY_REGISTRY.project.icon,
          label: ENTITY_REGISTRY.project.namePlural,
          href: ENTITY_REGISTRY.project.basePath,
          active:
            pathname?.startsWith(ENTITY_REGISTRY.project.basePath) ||
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
          href: ROUTES.HOME,
          active: pathname === ROUTES.HOME,
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
          href: ROUTES.AUTH,
          active: pathname?.startsWith('/profile') || pathname?.startsWith('/profiles'),
        },
      ];

  // Handle click on primary "+" button
  const handlePrimaryClick = (item: typeof navItems[number]) => {
    if ('createAction' in item && item.createAction) {
      const action = item.createAction;
      if (action.type === 'post') {
        // Open composer for posts
        openComposer();
        router.push(`${ROUTES.TIMELINE}?compose=true`);
      } else if (action.type === 'entity') {
        // Navigate directly to entity creation
        router.push(action.href);
      } else if (action.type === 'menu') {
        // Show the create sheet with all options
        setShowCreateSheet(true);
      }
    } else {
      // Fallback for non-authenticated nav
      router.push(item.href);
    }
  };

  return (
    <>
    <div
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 border-t',
        'transition-all duration-300 ease-in-out',
        shouldBeTransparent
          ? 'bg-white/20 backdrop-blur-sm border-transparent'
          : 'bg-white/95 backdrop-blur-md',
        isAuthenticated ? 'border-orange-200/50 shadow-lg' : 'border-gray-200/50'
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
              onClick={(e) => {
                e.preventDefault();
                if (item.primary) {
                  // Use contextual handler for primary "+" button
                  handlePrimaryClick(item);
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
                isActive && (isAuthenticated ? 'text-orange-600' : 'text-tiffany-600'),
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
                    isAuthenticated
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

    {/* Mobile Create Sheet - shown when "+" triggers menu action */}
    <MobileCreateSheet
      isOpen={showCreateSheet}
      onClose={() => setShowCreateSheet(false)}
    />
    </>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';

export default MobileBottomNav;
