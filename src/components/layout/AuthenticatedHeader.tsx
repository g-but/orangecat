/**
 * Authenticated Header Component
 *
 * Consistent header for authenticated routes
 * Always displays: Logo, Dashboard, Discover navigation, Search, Actions
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Created consistent authenticated header component
 */

'use client';

import { Menu, Bell, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { HeaderNavigation } from './HeaderNavigation';
import { getNavigationItems } from '@/config/navigationConfig';
import Logo from '@/components/layout/Logo';
import { HeaderCreateButton } from '@/components/dashboard/SmartCreateButton';
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar';
import MobileSearchModal from '@/components/search/MobileSearchModal';
import UserProfileDropdown from '@/components/ui/UserProfileDropdown';
import { SIDEBAR_Z_INDEX, SIDEBAR_COLORS } from '@/constants/sidebar';

interface AuthenticatedHeaderProps {
  onToggleSidebar: () => void;
  onShowMobileSearch: () => void;
}

/**
 * Authenticated Header Component
 *
 * Provides consistent header experience for all authenticated routes:
 * - Logo (always visible on desktop, mobile when sidebar closed)
 * - Dashboard & Discover navigation links (desktop)
 * - Search bar (desktop) / Search button (mobile)
 * - Create button, Notifications, User profile dropdown
 * - Mobile menu toggle
 */
export function AuthenticatedHeader({
  onToggleSidebar,
  onShowMobileSearch,
}: AuthenticatedHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const navigation = getNavigationItems(user);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 ${SIDEBAR_Z_INDEX.HEADER} bg-white/95 backdrop-blur-lg shadow-sm border-b ${SIDEBAR_COLORS.BORDER}`}
      >
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Logo + Mobile Menu Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo - always visible */}
            <Logo />

            {/* Mobile Navigation Links - Compact */}
            <div className="lg:hidden flex items-center space-x-1 ml-2">
              {navigation.map(item => (
                <Link
                  key={item.name}
                  href={item.href || '#'}
                  className={`px-2 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href || '')
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Center: Desktop Navigation + Search */}
          <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-6 space-x-4">
            {/* Desktop Navigation Links */}
            <HeaderNavigation items={navigation} isActive={isActive} />

            {/* Desktop Search */}
            <div className="flex-1 max-w-md">
              <EnhancedSearchBar placeholder="Search projects, people..." className="w-full" />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3">
            {/* Mobile Search Button */}
            <button
              onClick={onShowMobileSearch}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Create Button */}
            <HeaderCreateButton />

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            </button>

            {/* User Profile Dropdown */}
            <UserProfileDropdown />
          </div>
        </div>
      </header>
    </>
  );
}
