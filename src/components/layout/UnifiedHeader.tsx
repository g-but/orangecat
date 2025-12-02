'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Menu,
  X,
  Bell,
  Search,
  Settings,
  LogOut,
  Home,
  User,
  FileText,
  Wallet,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useHeaderScroll } from '@/hooks/useHeaderScroll';
import { useMobileMenu } from '@/hooks/useMobileMenu';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { HeaderNavigation } from './HeaderNavigation';
import { isAuthenticatedRoute } from '@/config/headerRoutes';
import { getNavigationItems, navigationSections, bottomNavItems } from '@/config/navigationConfig';
import Logo from './Logo';
import AuthButtons from './AuthButtons';
import { HeaderCreateButton } from '@/components/dashboard/SmartCreateButton';
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar';
import MobileSearchModal from '@/components/search/MobileSearchModal';
import UserProfileDropdown from '@/components/ui/UserProfileDropdown';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UnifiedHeaderProps {
  showSearch?: boolean;
  variant?: 'default' | 'minimal';
  className?: string;
  hideForRoutes?: string[];
}

const AUTHENTICATED_ROUTES_WITH_OWN_HEADER = [
  '/dashboard',
  '/profile',
  '/settings',
  '/assets',
  '/people',
  '/events',
  '/organizations',
  '/funding',
];

const UnifiedHeader = React.memo(function UnifiedHeader({
  showSearch = true,
  variant = 'default',
  className = '',
  hideForRoutes = AUTHENTICATED_ROUTES_WITH_OWN_HEADER,
}: UnifiedHeaderProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { isScrolled, isHidden } = useHeaderScroll();
  const mobileMenu = useMobileMenu();
  const { isActive } = useActiveRoute();
  const navigation = getNavigationItems(user);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle closing animation - keep backdrop and menu visible during animation
  useEffect(() => {
    if (!mobileMenu.isOpen && isClosing) {
      // Clear any existing timeout
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      // Wait for animation to complete (300ms matches slideInLeft animation)
      closeTimeoutRef.current = setTimeout(() => {
        setIsClosing(false);
      }, 300);
      return () => {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      };
    } else if (mobileMenu.isOpen) {
      setIsClosing(false);
    }
  }, [mobileMenu.isOpen, isClosing]);

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClose = () => {
      setIsClosing(true);
      mobileMenu.close();
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        mobileMenu.isOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenu.isOpen) {
        handleClose();
      }
    };

    if (mobileMenu.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [mobileMenu.isOpen, mobileMenu.close]);

  // Handle logout
  const handleLogout = async () => {
    try {
      mobileMenu.close();
      await signOut();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  // Check if we should hide the header for authenticated routes
  // Use pathname directly since it's available on server and client
  const shouldHide = pathname ? isAuthenticatedRoute(pathname) : false;

  // X/Twitter-inspired header styling with proper z-index
  const headerClasses = [
    'fixed top-0 left-0 right-0 z-[40] transition-all duration-200',
    isScrolled
      ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200/50'
      : 'bg-white/98 backdrop-blur-md',
    isHidden ? '-translate-y-full' : 'translate-y-0',
    className,
  ].join(' ');

  return (
    <>
      <header className={cn(headerClasses, shouldHide && 'sr-only')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Hamburger Menu (Mobile) + Logo */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Mobile Menu Button - Always on left for consistency */}
              <button
                ref={mobileMenuButtonRef}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  mobileMenu.toggle();
                }}
                className="lg:hidden p-3 min-h-[44px] min-w-[44px] text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-150 touch-manipulation active:scale-95 flex items-center justify-center"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenu.isOpen}
                type="button"
              >
                {mobileMenu.isOpen ? (
                  <X className="w-5 h-5 transition-transform duration-200" />
                ) : (
                  <Menu className="w-5 h-5 transition-transform duration-200" />
                )}
              </button>
              <Logo />
            </div>

            {/* Center: Navigation + Search (Desktop) */}
            {user ? (
              <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-6 space-x-1">
                <HeaderNavigation items={navigation} isActive={isActive} />
                {showSearch && (
                  <div className="flex-1 max-w-md ml-4">
                    <EnhancedSearchBar
                      placeholder="Search projects, people..."
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            ) : (
              showSearch && (
                <div className="flex-1 max-w-md mx-6 hidden md:block">
                  <EnhancedSearchBar placeholder="Search projects, people..." className="w-full" />
                </div>
              )
            )}

            {/* Right: Actions */}
            <div className="flex items-center space-x-1">
              {/* Desktop Navigation for Public Users */}
              {!user && (
                <HeaderNavigation
                  items={navigation}
                  isActive={isActive}
                  className="hidden lg:flex items-center space-x-1 mr-4"
                />
              )}

              {/* Search Button (Mobile) */}
              {showSearch && (
                <button
                  onClick={() => setShowMobileSearch(true)}
                  className="md:hidden p-3 min-h-[44px] min-w-[44px] text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-150 flex items-center justify-center"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Authenticated User Actions */}
              {user && (
                <>
                  {/* Create Button - X-style */}
                  <HeaderCreateButton />

                  {/* Notifications - X-style */}
                  <button
                    className="relative p-3 min-h-[44px] min-w-[44px] text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-150 flex items-center justify-center"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></span>
                  </button>

                  {/* User Menu */}
                  <UserProfileDropdown />
                </>
              )}

              {/* Auth Buttons for non-authenticated users */}
              {!user && (
                <div className="hidden lg:block ml-4">
                  <AuthButtons />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu - Rendered via portal for z-index safety */}
        {(mobileMenu.isOpen || isClosing) &&
          typeof window !== 'undefined' &&
          createPortal(
            <>
              {/* Mobile Menu Backdrop - X-style overlay */}
              <div
                className={cn(
                  'lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300',
                  isClosing ? 'opacity-0' : 'opacity-100'
                )}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsClosing(true);
                  mobileMenu.close();
                }}
                onTouchStart={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsClosing(true);
                  mobileMenu.close();
                }}
                aria-hidden="true"
              />

              {/* Mobile Menu - Slide-in drawer from left (consistent with dashboard sidebar) */}
              <div
                ref={mobileMenuRef}
                className={cn(
                  'lg:hidden fixed top-16 bottom-0 left-0 w-80 max-w-[85vw] sm:max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-[9999] overflow-y-auto overscroll-contain transition-transform duration-300 ease-out',
                  isClosing ? '-translate-x-full' : 'translate-x-0'
                )}
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  height: 'calc(100vh - 4rem)', // Explicit height calculation
                }}
                data-mobile-menu="true"
              >
                <div className="flex flex-col h-full">
                  {/* User Profile Section - Top (if authenticated) */}
                  {user && profile && (
                    <Link
                      href={`/profiles/${profile.username || 'me'}`}
                      onClick={mobileMenu.close}
                      className="p-4 border-b border-gray-200 bg-gradient-to-br from-orange-50/50 to-tiffany-50/50 hover:from-orange-100/50 hover:to-tiffany-100/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.name || profile.username || 'User'}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-tiffany-400 flex items-center justify-center text-white font-bold text-lg ring-2 ring-orange-200">
                            {profile.name?.[0] || profile.username?.[0] || 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {profile.name || profile.username || 'User'}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            @{profile.username || 'user'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Auth Section - Top (if not authenticated) */}
                  {!user && (
                    <div className="p-4 bg-gradient-to-br from-orange-50/50 to-tiffany-50/50 border-b border-gray-200">
                      <div className="space-y-3">
                        <Link href="/auth?mode=login" className="block" onClick={mobileMenu.close}>
                          <button className="w-full h-12 px-4 text-base font-semibold border-2 border-gray-300 text-gray-900 hover:bg-gray-50 rounded-full transition-colors duration-150">
                            Log in
                          </button>
                        </Link>
                        <Link
                          href="/auth?mode=register"
                          className="block"
                          onClick={mobileMenu.close}
                        >
                          <button className="w-full h-12 px-4 text-base font-semibold bg-gradient-to-r from-orange-500 to-tiffany-500 hover:from-orange-600 hover:to-tiffany-600 text-white rounded-full shadow-md transition-all duration-150 active:scale-95">
                            Get Started Free
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Navigation Links - Use same structure as Sidebar for consistency */}
                  <nav className="flex-1 p-2 overflow-y-auto">
                    <div className="space-y-4">
                      {/* Render navigation sections (same as Sidebar) */}
                      {navigationSections
                        .filter(section => !section.requiresAuth || user)
                        .map(section => {
                          const sectionItems = section.items.filter(
                            item => !item.requiresAuth || user
                          );

                          if (sectionItems.length === 0) {
                            return null;
                          }

                          return (
                            <div key={section.id} className="space-y-1">
                              {/* Section Header */}
                              <div className="px-4 py-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                  {section.title}
                                </h3>
                              </div>

                              {/* Section Items */}
                              <div className="space-y-1">
                                {sectionItems.map(item => {
                                  const isActiveRoute = isActive(item.href);
                                  const Icon = item.icon;
                                  const linkClasses = [
                                    'flex items-center w-full px-4 py-3.5 text-base font-medium rounded-full transition-all duration-200 touch-manipulation',
                                    isActiveRoute
                                      ? 'bg-orange-500 text-white shadow-md font-semibold'
                                      : 'text-gray-900 hover:bg-gray-100 active:bg-gray-200',
                                  ].join(' ');

                                  return (
                                    <Link
                                      key={item.name}
                                      href={item.href}
                                      className={linkClasses}
                                      onClick={mobileMenu.close}
                                    >
                                      {Icon && <Icon className="w-5 h-5 mr-3" />}
                                      <span>{item.name}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </nav>

                  {/* Bottom Actions - Use same structure as Sidebar for consistency */}
                  {user && bottomNavItems.length > 0 && (
                    <div className="p-4 border-t border-gray-200 space-y-1 bg-gray-50/50">
                      {bottomNavItems.map(item => {
                        const Icon = item.icon;
                        const isActiveRoute = isActive(item.href);
                        const linkClasses = [
                          'flex items-center w-full px-4 py-3.5 text-base font-medium rounded-full transition-all duration-150 touch-manipulation',
                          isActiveRoute
                            ? 'bg-orange-500 text-white shadow-md font-semibold'
                            : 'text-gray-900 hover:bg-gray-100 active:bg-gray-200',
                        ].join(' ');

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={linkClasses}
                            onClick={mobileMenu.close}
                          >
                            {Icon && <Icon className="w-5 h-5 mr-3" />}
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3.5 text-base font-medium text-red-600 hover:bg-red-50 active:bg-red-100 rounded-full transition-all duration-150 touch-manipulation"
                        type="button"
                      >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span>Log out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>,
            document.body
          )}
      </header>

      {/* Mobile Search Modal */}
      {showSearch && (
        <MobileSearchModal isOpen={showMobileSearch} onClose={() => setShowMobileSearch(false)} />
      )}

      {/* Spacer to prevent content overlap */}
      <div className="h-16" />
    </>
  );
});

UnifiedHeader.displayName = 'UnifiedHeader';

export default UnifiedHeader;
