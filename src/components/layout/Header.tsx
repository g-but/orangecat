'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useHeaderScroll } from '@/hooks/useHeaderScroll';
import { useMobileMenu } from '@/hooks/useMobileMenu';
import { useIsAuthRoute } from '@/hooks/useRouteContext';
import { useMobileMenuAnimation } from '@/hooks/useMobileMenuAnimation';
import { getHeaderNavigationItems, footerNavigation } from '@/config/navigation';
import { getAuthStatus } from '@/lib/auth/utils';
import { getHeaderClasses } from '@/lib/ui/header-utils';
import { HEADER_DIMENSIONS, HEADER_SPACING } from '@/constants/header';
import Logo from './Logo';
import AuthButtons from './AuthButtons';
import { HeaderCreateButton } from '@/components/dashboard/SmartCreateButton';
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar';
import MobileSearchModal from '@/components/search/MobileSearchModal';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { EmailConfirmationBanner } from './EmailConfirmationBanner';
import { MobileSearchButton, MessagesButton, NotificationsButton } from './HeaderActions';
import { MenuToggleButton } from './MenuToggleButton';
import { DesktopNavigation } from './DesktopNavigation';
import { MobileMenu } from './MobileMenu';
import UserProfileDropdown from '@/components/ui/UserProfileDropdown';

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
  variant: _variant = 'default',
  className = '',
}: HeaderProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const authState = useAuth();
  const authStatus = getAuthStatus(authState);
  const { isScrolled, isHidden } = useHeaderScroll();
  const mobileMenu = useMobileMenu();
  const isAuthRoute = useIsAuthRoute();
  const navigation = getHeaderNavigationItems(authState.user);

  // Mobile menu animation state
  const { menuRef, buttonRef, isClosing, handleClose } = useMobileMenuAnimation({
    isOpen: mobileMenu.isOpen,
    onClose: mobileMenu.close,
  });

  // Header classes with scroll behavior
  const headerClasses = getHeaderClasses(isScrolled, isHidden, className);

  return (
    <>
      <header
        className={headerClasses}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Mobile-First Header: Optimized for small screens */}
        <div
          className={`mx-auto ${HEADER_SPACING.MAX_WIDTH} ${HEADER_DIMENSIONS.HEIGHT_MOBILE} ${HEADER_DIMENSIONS.HEIGHT_DESKTOP} ${HEADER_SPACING.CONTAINER_PADDING} flex items-center justify-between w-full ${HEADER_SPACING.ITEM_GAP}`}
        >
          {/* Left Section: Menu + Logo (Mobile-First) */}
          <div className={`flex items-center ${HEADER_SPACING.ITEM_GAP} min-w-0 flex-1`}>
            {/* Sidebar/Menu Toggle - Always first, proper touch target */}
            {showSidebarToggle && onToggleSidebar ? (
              <MenuToggleButton onClick={onToggleSidebar} ariaLabel="Toggle sidebar" />
            ) : !isAuthRoute ? (
              <MenuToggleButton
                ref={buttonRef}
                onClick={() => mobileMenu.open()}
                ariaLabel="Open navigation menu"
              />
            ) : null}

            {/* Logo - Icon only on mobile, text on larger screens */}
            <div className="flex-shrink-0 min-w-0">
              <Logo showText={false} size="sm" className="sm:hidden" />
              <Logo showText={true} size="md" className="hidden sm:block" />
            </div>

            {/* Desktop Navigation Links */}
            <DesktopNavigation items={navigation} />
          </div>

          {/* Center Section: Search (Desktop only) */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
              <EnhancedSearchBar />
            </div>
          )}

          {/* Right Section: Actions (Mobile-Optimized) */}
          <div className={`flex items-center ${HEADER_SPACING.ACTION_GAP} flex-shrink-0`}>
            {/* Mobile Search Button - Hidden on desktop, more prominent */}
            {showSearch && <MobileSearchButton onClick={() => setShowMobileSearch(true)} />}

            {/* Create Button (authenticated only) - Icon only on mobile */}
            {isAuthRoute && (
              <div className="hidden sm:block">
                <HeaderCreateButton />
              </div>
            )}

            {/* Messages Button - Always visible for authenticated users regardless of route */}
            {authStatus.authenticated && <MessagesButton />}

            {/* Notifications - Always visible for authenticated users regardless of route */}
            {authStatus.authenticated && (
              <NotificationsButton onClick={() => setShowNotifications(!showNotifications)} />
            )}

            {/* User Menu or Auth Buttons */}
            <div className="flex-shrink-0">
              {authStatus.authenticated ? <UserProfileDropdown /> : <AuthButtons />}
            </div>
          </div>
        </div>
      </header>

      {/* Email Confirmation Banner - Modular component */}
      {authStatus.authenticated && authState.user && (
        <EmailConfirmationBanner
          emailConfirmedAt={authState.user.email_confirmed_at}
          userId={authState.user.id}
          className={`fixed ${HEADER_DIMENSIONS.TOP_OFFSET_MOBILE} ${HEADER_DIMENSIONS.TOP_OFFSET_DESKTOP} left-0 right-0 z-40`}
        />
      )}

      {/* Mobile Search Modal */}
      {showMobileSearch && (
        <MobileSearchModal isOpen={showMobileSearch} onClose={() => setShowMobileSearch(false)} />
      )}

      {/* Notification Center */}
      {showNotifications && (
        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Mobile Menu (public routes only) */}
      {!isAuthRoute && (
        <MobileMenu
          isOpen={mobileMenu.isOpen}
          isClosing={isClosing}
          menuRef={menuRef}
          navigation={navigation}
          footer={footerNavigation}
          onClose={handleClose}
        />
      )}
    </>
  );
}
