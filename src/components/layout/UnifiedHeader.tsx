'use client';

import { useState, useEffect, useRef } from 'react';
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
import { getNavigationItems } from '@/config/navigationConfig';
import Logo from './Logo';
import AuthButtons from './AuthButtons';
import { HeaderCreateButton } from '@/components/dashboard/SmartCreateButton';
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar';
import MobileSearchModal from '@/components/search/MobileSearchModal';
import UserProfileDropdown from '@/components/ui/UserProfileDropdown';
import { toast } from 'sonner';

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

export default function UnifiedHeader({
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

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
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

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenu.isOpen) {
        mobileMenu.close();
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

  // Hide UnifiedHeader for routes that have their own header
  const shouldHide = isAuthenticatedRoute(pathname);

  if (shouldHide) {
    return <div className="h-16" />;
  }

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
      <header className={headerClasses}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <div className="flex-shrink-0">
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
                  className="md:hidden p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-150"
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
                    className="relative p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-150"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
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

              {/* Mobile Menu Button - X-style hamburger */}
              <button
                ref={mobileMenuButtonRef}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  mobileMenu.toggle();
                }}
                className="lg:hidden p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-150 ml-2 touch-manipulation active:scale-95"
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
            </div>
          </div>
        </div>

        {/* Mobile Menu Backdrop - X-style overlay */}
        {mobileMenu.isOpen && (
          <div
            className="lg:hidden fixed top-16 bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm z-[50] transition-opacity duration-200"
            onClick={mobileMenu.close}
            onTouchStart={mobileMenu.close}
            aria-hidden="true"
          />
        )}

        {/* Mobile Menu - X-inspired slide-in drawer */}
        {mobileMenu.isOpen && (
          <div
            ref={mobileMenuRef}
            className="lg:hidden fixed top-16 bottom-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl z-[55] overflow-y-auto overscroll-contain"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              animation: 'slideInLeft 0.3s ease-out',
            }}
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
                        alt={profile.display_name || profile.username || 'User'}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-tiffany-400 flex items-center justify-center text-white font-bold text-lg ring-2 ring-orange-200">
                        {profile.display_name?.[0] || profile.username?.[0] || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {profile.display_name || profile.username || 'User'}
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
                    <Link href="/auth?mode=register" className="block" onClick={mobileMenu.close}>
                      <button className="w-full h-12 px-4 text-base font-semibold bg-gradient-to-r from-orange-500 to-tiffany-500 hover:from-orange-600 hover:to-tiffany-600 text-white rounded-full shadow-md transition-all duration-150 active:scale-95">
                        Get Started Free
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Navigation Links - X-style */}
              <nav className="flex-1 p-2 overflow-y-auto">
                <div className="space-y-1">
                  {navigation.map(item => {
                    if (!item.href) {
                      return null;
                    }

                    const isActiveRoute = isActive(item.href);
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
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}

                  {/* Additional authenticated user links */}
                  {user && (
                    <>
                      <div className="h-px bg-gray-200 my-2 mx-4" />
                      <Link
                        href="/dashboard"
                        className="flex items-center w-full px-4 py-3.5 text-base font-medium text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-all duration-200 touch-manipulation"
                        onClick={mobileMenu.close}
                      >
                        <Home className="w-5 h-5 mr-3" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        href="/dashboard/projects"
                        className="flex items-center w-full px-4 py-3.5 text-base font-medium text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-all duration-200 touch-manipulation"
                        onClick={mobileMenu.close}
                      >
                        <FileText className="w-5 h-5 mr-3" />
                        <span>My Projects</span>
                      </Link>
                      <Link
                        href="/dashboard/wallets"
                        className="flex items-center w-full px-4 py-3.5 text-base font-medium text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-all duration-200 touch-manipulation"
                        onClick={mobileMenu.close}
                      >
                        <Wallet className="w-5 h-5 mr-3" />
                        <span>Wallets</span>
                      </Link>
                    </>
                  )}
                </div>
              </nav>

              {/* Bottom Actions (if authenticated) - X-style */}
              {user && (
                <div className="p-4 border-t border-gray-200 space-y-1 bg-gray-50/50">
                  <Link
                    href="/settings"
                    className="flex items-center w-full px-4 py-3.5 text-base font-medium text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-all duration-150 touch-manipulation"
                    onClick={mobileMenu.close}
                  >
                    <Settings className="w-5 h-5 mr-3" />
                    <span>Settings</span>
                  </Link>
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
