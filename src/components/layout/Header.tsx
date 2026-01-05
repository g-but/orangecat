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
  MessageSquare,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useHeaderScroll } from '@/hooks/useHeaderScroll';
import { useMobileMenu } from '@/hooks/useMobileMenu';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { HeaderNavigation } from './HeaderNavigation';
import { getRouteContext, isAuthenticatedRoute } from '@/config/routes';
import {
  getHeaderNavigationItems,
  sidebarSections,
  bottomNavItems,
  footerNavigation,
  userMenuItems,
  authNavigationItems,
} from '@/config/navigation';
import { Z_INDEX_CLASSES } from '@/constants/z-index';
import Logo from './Logo';
import AuthButtons from './AuthButtons';
import { HeaderCreateButton } from '@/components/dashboard/SmartCreateButton';
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar';
import MobileSearchModal from '@/components/search/MobileSearchModal';
import UserProfileDropdown from '@/components/ui/UserProfileDropdown';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useUnreadCount } from '@/stores/messaging';
import { useMessagingService } from '@/hooks/useMessagingService';
import { EmailConfirmationBanner } from './EmailConfirmationBanner';

interface HeaderProps {
  /** Whether to show the sidebar toggle button (authenticated routes) */
  showSidebarToggle?: boolean;
  /** Callback to toggle sidebar */
  onToggleSidebar?: () => void;
  /** Whether to show search functionality */
  showSearch?: boolean;
  /** Header variant */
  variant?: 'default' | 'minimal';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Unified Header Component
 *
 * Single header component that adapts to both public and authenticated contexts.
 * Handles all navigation, search, notifications, and user interactions.
 */
export function Header({
  showSidebarToggle = false,
  onToggleSidebar,
  showSearch = true,
  variant = 'default',
  className = '',
}: HeaderProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { isScrolled, isHidden } = useHeaderScroll();
  const mobileMenu = useMobileMenu();
  const { isActive } = useActiveRoute();
  const { count: unreadMessages } = useUnreadCount();

  const routeContext = getRouteContext(pathname);
  const isAuthRoute = routeContext === 'authenticated' || routeContext === 'contextual';
  const navigation = getHeaderNavigationItems(user);

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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (mobileMenu.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenu.isOpen, mobileMenu]);

  // Header classes with scroll behavior and context-aware styling
  const headerClasses = cn(
    'fixed top-0 left-0 right-0 transition-all duration-200',
    Z_INDEX_CLASSES.HEADER,
    isScrolled
      ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200/50'
      : 'bg-white/95 backdrop-blur-lg shadow-sm border-b',
    isHidden ? '-translate-y-full' : 'translate-y-0',
    className
  );

  return (
    <>
      <header
        className={headerClasses}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Mobile-First Header: Optimized for small screens */}
        <div className="mx-auto max-w-7xl h-14 sm:h-16 px-3 sm:px-4 md:px-6 flex items-center justify-between w-full gap-2 sm:gap-3">
          {/* Left Section: Menu + Logo (Mobile-First) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Sidebar/Menu Toggle - Always first, proper touch target */}
            {showSidebarToggle && onToggleSidebar ? (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden flex-shrink-0 w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            ) : !isAuthRoute ? (
              <button
                ref={mobileMenuButtonRef}
                onClick={() => mobileMenu.open()}
                className="lg:hidden flex-shrink-0 w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            ) : null}

            {/* Logo - Icon only on mobile, text on larger screens */}
            <div className="flex-shrink-0 min-w-0">
              <Logo showText={false} size="sm" className="sm:hidden" />
              <Logo showText={true} size="md" className="hidden sm:block" />
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2 ml-2">
              {navigation.map(item => (
                <Link
                  key={item.name}
                  href={item.href!}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap',
                    isActive(item.href!)
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Center Section: Search (Desktop only) */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
              <EnhancedSearchBar />
            </div>
          )}

          {/* Right Section: Actions (Mobile-Optimized) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Mobile Search Button - Hidden on desktop, more prominent */}
            {showSearch && (
              <button
                onClick={() => setShowMobileSearch(true)}
                className="md:hidden flex-shrink-0 w-11 h-11 flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-orange-50 active:bg-orange-100 border border-gray-200 hover:border-orange-300 rounded-lg transition-all touch-manipulation min-w-[44px] min-h-[44px] shadow-sm"
                aria-label="Search projects, people, organizations"
              >
                <Search className="w-5 h-5" strokeWidth={2} />
              </button>
            )}

            {/* Create Button (authenticated only) - Icon only on mobile */}
            {isAuthRoute && (
              <div className="hidden sm:block">
                <HeaderCreateButton />
              </div>
            )}

            {/* Messages Button (authenticated only) - Show on mobile but can be hidden if too crowded */}
            {isAuthRoute && (
              <button
                onClick={() => router.push('/messages')}
                className="flex-shrink-0 w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation relative min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                aria-label={`Messages ${unreadMessages > 0 ? `(${unreadMessages} unread)` : ''}`}
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 min-w-[16px] flex items-center justify-center font-semibold leading-none">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>
            )}

            {/* Notifications - Always visible but can be smaller on mobile */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex-shrink-0 w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation relative min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* User Menu or Auth Buttons */}
            {user ? (
              <div className="flex-shrink-0">
                <UserProfileDropdown
                  user={user}
                  profile={profile}
                  onSignOut={signOut}
                  navigationItems={userMenuItems}
                />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <AuthButtons items={authNavigationItems} />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Email Confirmation Banner - Modular component */}
      {user && (
        <EmailConfirmationBanner
          emailConfirmedAt={user.email_confirmed_at}
          userId={user.id}
          className="fixed top-14 sm:top-16 left-0 right-0 z-40"
        />
      )}

      {/* Mobile Search Modal */}
      {showMobileSearch && <MobileSearchModal onClose={() => setShowMobileSearch(false)} />}

      {/* Notification Center */}
      {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}

      {/* Mobile Menu (public routes only) */}
      {!isAuthRoute &&
        (mobileMenu.isOpen || isClosing) &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={cn(
                'fixed inset-0 backdrop-blur-sm transition-opacity duration-300',
                Z_INDEX_CLASSES.MOBILE_MENU_BACKDROP,
                mobileMenu.isOpen ? 'opacity-100' : 'opacity-0'
              )}
            />

            {/* Mobile Menu Panel */}
            <div
              ref={mobileMenuRef}
              className={cn(
                'fixed top-16 bottom-0 left-0 w-80 max-w-[85vw] sm:max-w-sm bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto overscroll-contain transition-transform duration-300 ease-out',
                Z_INDEX_CLASSES.MOBILE_MENU,
                mobileMenu.isOpen ? 'translate-x-0' : '-translate-x-full'
              )}
            >
              {/* Mobile Navigation */}
              <HeaderNavigation
                navigation={navigation}
                footer={footerNavigation}
                onClose={() => {
                  setIsClosing(true);
                  mobileMenu.close();
                }}
              />
            </div>
          </>,
          document.body
        )}
    </>
  );
}
