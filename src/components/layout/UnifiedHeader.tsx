'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X, Bell, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useHeaderScroll } from '@/hooks/useHeaderScroll';
import { useMobileMenu } from '@/hooks/useMobileMenu';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { HeaderNavigation } from './HeaderNavigation';
import { isAuthenticatedRoute } from '@/config/headerRoutes';
import { getNavigationItems } from '@/config/navigationConfig';
import Logo from './Logo';
import AuthButtons from './AuthButtons';
import { HeaderCreateButton } from '@/components/dashboard/SmartCreateButton';
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar';
import MobileSearchModal from '@/components/search/MobileSearchModal';
import UserProfileDropdown from '@/components/ui/UserProfileDropdown';

interface UnifiedHeaderProps {
  showSearch?: boolean;
  variant?: 'default' | 'minimal';
  className?: string;
  hideForRoutes?: string[]; // Routes that have their own header
}

/**
 * Routes that use AuthenticatedLayout and have their own header
 * UnifiedHeader should be hidden for these routes to avoid duplicate headers
 *
 * Note: Only routes that are in the (authenticated) folder should be listed here
 *
 * @deprecated Use isAuthenticatedRoute() from '@/config/headerRoutes' instead
 */
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

export default function UnifiedHeader({
  showSearch = true,
  variant = 'default',
  className = '',
  hideForRoutes = AUTHENTICATED_ROUTES_WITH_OWN_HEADER,
}: UnifiedHeaderProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { isScrolled, isHidden } = useHeaderScroll();
  const mobileMenu = useMobileMenu();
  const { isActive } = useActiveRoute();
  const navigation = getNavigationItems(user);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenu.isOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target as Node)
      ) {
        mobileMenu.close();
      }
    };

    if (mobileMenu.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [mobileMenu.isOpen, mobileMenu.close]);

  // Hide UnifiedHeader for routes that have their own header (like AuthenticatedLayout)
  // Use precise route matching to prevent false positives
  const shouldHide = isAuthenticatedRoute(pathname);

  if (shouldHide) {
    // Still render spacer to prevent layout shift
    return <div className="h-16" />;
  }

  // Build header classes
  const headerClasses = [
    'fixed top-0 left-0 right-0 z-header transition-all duration-150',
    isScrolled
      ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200'
      : 'bg-white/90 backdrop-blur-md',
    isHidden ? '-translate-y-full' : 'translate-y-0',
    className,
  ].join(' ');

  return (
    <>
      <header className={headerClasses}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <div className="flex-shrink-0">
              <Logo />
            </div>

            {/* Center: Navigation + Search (Desktop) - Match AuthenticatedHeader layout for consistency */}
            {user ? (
              // Authenticated users: Navigation links + Search (like AuthenticatedHeader)
              <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-6 space-x-4">
                {/* Desktop Navigation Links */}
                <HeaderNavigation items={navigation} isActive={isActive} />

                {/* Desktop Search */}
                {showSearch && (
                  <div className="flex-1 max-w-md">
                    <EnhancedSearchBar
                      placeholder="Search projects, people..."
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            ) : (
              // Public users: Search only (center)
              showSearch && (
                <div className="flex-1 max-w-md mx-6 hidden md:block">
                  <EnhancedSearchBar placeholder="Search projects, people..." className="w-full" />
                </div>
              )
            )}

            {/* Right: Navigation (public) + Actions */}
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
                  className="md:hidden p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-150"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Authenticated User Actions */}
              {user && (
                <>
                  {/* Create Button */}
                  <HeaderCreateButton />

                  {/* Notifications */}
                  <button className="relative p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-150">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
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

              {/* Mobile Menu Button */}
              <button
                ref={mobileMenuButtonRef}
                onClick={mobileMenu.toggle}
                className="lg:hidden p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-150 ml-2"
                aria-label="Toggle mobile menu"
              >
                {mobileMenu.isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu.isOpen && (
          <div
            ref={mobileMenuRef}
            className="lg:hidden bg-white border-t border-gray-200 shadow-lg"
          >
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation */}
              <div className="space-y-2">
                {navigation.map(item => {
                  const mobileClasses = [
                    'block px-3 py-2 text-sm font-medium rounded-md transition-all duration-150',
                    isActive(item.href)
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50',
                  ].join(' ');

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={mobileClasses}
                      onClick={mobileMenu.close}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Auth Actions */}
              {!user && (
                <div className="pt-4 border-t border-gray-200">
                  <AuthButtons />
                </div>
              )}

              {/* Mobile User Section */}
              {user && (
                <div className="pt-4 border-t border-gray-200">
                  <UserProfileDropdown />
                </div>
              )}
            </div>
          </div>
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
}
