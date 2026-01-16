/**
 * Sidebar Component
 *
 * Main sidebar component that combines user profile and navigation
 *
 * Fixed-width pattern with flyout tooltips:
 * - Desktop: Fixed w-16 (icons only), flyout tooltips on hover
 * - Mobile: Full-width w-64 slide-out drawer
 * - No jarring width animations
 * - Content area stays fixed
 *
 * Created: 2025-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Replaced hover-to-expand with fixed-width + flyout tooltips for better UX
 */

'use client';

import { Menu, X } from 'lucide-react';
import FocusLock from 'react-focus-lock';
import { SidebarUserProfile } from './SidebarUserProfile';
import { SidebarNavigation } from './SidebarNavigation';
import type { NavSection, NavItem } from '@/hooks/useNavigation';
import type { Profile } from '@/types/database';
import { navigationLabels } from '@/config/navigation';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import {
  SIDEBAR_WIDTHS,
  SIDEBAR_Z_INDEX,
  SIDEBAR_TRANSITIONS,
  SIDEBAR_COLORS,
  SIDEBAR_SPACING,
  SIDEBAR_BREAKPOINTS,
} from '@/constants/sidebar';

interface SidebarProps {
  user: { id: string } | null;
  profile: Profile | null;
  sections: NavSection[];
  bottomItems: NavItem[];
  navigationState: {
    isSidebarOpen: boolean;
    collapsedSections: Set<string>;
  };
  isItemActive: (href: string) => boolean;
  toggleSidebar: () => void;
  toggleSection: (sectionId: string) => void;
  onNavigate?: () => void;
}

export function Sidebar({
  user,
  profile,
  sections,
  bottomItems,
  navigationState,
  isItemActive,
  toggleSidebar,
  toggleSection,
  onNavigate,
}: SidebarProps) {
  const handleNavigate = () => {
    // On mobile, close sidebar after navigation
    if (navigationState.isSidebarOpen && onNavigate) {
      onNavigate();
    }
  };

  // Desktop: Always fixed w-16 (icons only with flyout tooltips)
  // Mobile: w-64 full-width drawer when open
  // Using useIsDesktop hook (SSR-safe, reactive to window resizing)
  const isDesktop = useIsDesktop();

  // Desktop sidebar is always visible at fixed width
  // Mobile sidebar slides in/out
  const sidebarTranslate = navigationState.isSidebarOpen
    ? 'translate-x-0'
    : '-translate-x-full lg:translate-x-0';

  // isExpanded only true on mobile when drawer is open
  // Desktop always shows icons only (tooltips handle labels)
  const isExpanded = !isDesktop && navigationState.isSidebarOpen;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {navigationState.isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Focus trap for mobile drawer (accessibility) */}
      {/* Disabled on desktop where sidebar is always visible */}
      <FocusLock disabled={!navigationState.isSidebarOpen || isDesktop}>
        {/* NOTE: Using literal class names w-64 and lg:w-16 instead of template interpolation
            because Tailwind JIT can't detect dynamically generated responsive classes like lg:${SIDEBAR_WIDTHS.COLLAPSED} */}
        <aside
          className={`fixed bottom-0 left-0 ${SIDEBAR_Z_INDEX.SIDEBAR} flex flex-col ${SIDEBAR_COLORS.BACKGROUND} shadow-lg border-r ${SIDEBAR_COLORS.BORDER} ${sidebarTranslate} overflow-y-auto overflow-x-visible transition-transform ${SIDEBAR_TRANSITIONS.DURATION} ${SIDEBAR_TRANSITIONS.EASING} w-64 lg:w-16`}
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            top: 'calc(4rem + env(safe-area-inset-top, 0px))',
          }}
        >
          <div className="flex flex-col h-full min-w-0">
          {/* User Profile Section */}
          {user && profile && (
            <SidebarUserProfile
              profile={profile}
              isExpanded={isExpanded}
              onNavigate={handleNavigate}
            />
          )}

          {/* Navigation Sections */}
          <SidebarNavigation
            sections={sections}
            bottomItems={bottomItems}
            isExpanded={isExpanded}
            collapsedSections={navigationState.collapsedSections}
            isItemActive={isItemActive}
            toggleSection={toggleSection}
            onNavigate={handleNavigate}
          />

          {/* Toggle Button - Desktop only (expands to full drawer) */}
          <div className={`border-t border-gray-100 px-3 py-2 hidden lg:block mt-auto`}>
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition-colors duration-200"
              aria-label={
                navigationState.isSidebarOpen
                  ? navigationLabels.SIDEBAR_COLLAPSE
                  : navigationLabels.SIDEBAR_EXPAND
              }
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Close Button */}
          {navigationState.isSidebarOpen && (
            <div className={`border-t border-gray-100 ${SIDEBAR_SPACING.PADDING_X} py-2 lg:hidden mt-auto`}>
              <button
                onClick={toggleSidebar}
                className="w-full flex items-center gap-3 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition-colors duration-200"
                aria-label={navigationLabels.SIDEBAR_COLLAPSE}
              >
                <X className="h-5 w-5" />
                <span>Close menu</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </FocusLock>
    </>
  );
}
