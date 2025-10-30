'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X, Bell, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Logo from './Logo';
import AuthButtons from './AuthButtons';
import { HeaderCreateButton } from '@/components/dashboard/SmartCreateButton';
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar';
import MobileSearchModal from '@/components/search/MobileSearchModal';
import UserProfileDropdown from '@/components/ui/UserProfileDropdown';

// Navigation items that adapt based on auth state
const getNavigation = (user: any) => {
  if (user) {
    return [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Discover', href: '/discover' },
    ];
  }

  return [
    { name: 'Discover', href: '/discover' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
  ];
};

interface UnifiedHeaderProps {
  showSearch?: boolean;
  variant?: 'default' | 'minimal';
  className?: string;
}

export default function UnifiedHeader({
  showSearch = true,
  variant = 'default',
  className = '',
}: UnifiedHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollRef = useRef<number>(0);
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const navigation = getNavigation(user);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle scroll for backdrop blur effect and hide-on-scroll
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setIsScrolled(current > 0);
      const isScrollingDown = current > lastScrollRef.current && current > 80;
      const isScrollingUp = current < lastScrollRef.current;
      // Hide on scroll down, show when scrolling up
      if (isScrollingDown) {
        setIsHidden(true);
      }
      if (isScrollingUp) {
        setIsHidden(false);
      }
      lastScrollRef.current = current;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

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

            {/* Center: Search (Desktop) */}
            {showSearch && (
              <div className="flex-1 max-w-md mx-6 hidden md:block">
                <EnhancedSearchBar placeholder="Search projects, people..." className="w-full" />
              </div>
            )}

            {/* Right: Navigation + Actions */}
            <div className="flex items-center space-x-1">
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-1 mr-4">
                {navigation.map(item => {
                  const linkClasses = [
                    'px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 relative',
                    isActive(item.href)
                      ? 'text-orange-600 bg-orange-50 shadow-sm'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50',
                  ].join(' ');

                  return (
                    <Link key={item.name} href={item.href} className={linkClasses}>
                      {item.name}
                      {isActive(item.href) && (
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-orange-500 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </div>

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
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-150 ml-2"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
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
                      onClick={() => setIsMobileMenuOpen(false)}
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
