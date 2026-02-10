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

import { X, PanelLeftClose, PanelLeft } from 'lucide-react';
import FocusLock from 'react-focus-lock';
import { SidebarUserProfile } from './SidebarUserProfile';
import { SidebarNavigation } from './SidebarNavigation';
import type { NavSection, NavItem } from '@/hooks/useNavigation';
import type { Profile } from '@/types/database';
import { navigationLabels } from '@/config/navigation';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import {
  SIDEBAR_Z_INDEX,
  SIDEBAR_TRANSITIONS,
  SIDEBAR_COLORS,
  SIDEBAR_SPACING,
} from '@/constants/sidebar';

interface SidebarProps {
  user: { id: string } | null;
  profile: Profile | null;
  sections: NavSection[];
  bottomItems: NavItem[];
  navigationState: {
    isSidebarOpen: boolean;
    isSidebarCollapsed: boolean;
    collapsedSections: Set<string>;
  };
  isItemActive: (href: string) => boolean;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
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
  toggleSidebarCollapse,
  toggleSection,
  onNavigate,
}: SidebarProps) {
  const handleNavigate = () => {
    // On mobile, close sidebar after navigation
    if (navigationState.isSidebarOpen && onNavigate) {
      onNavigate();
    }
  };

  // Desktop: w-64 (full width) or w-16 (collapsed, icons only) based on user preference
  // Mobile: w-64 full-width drawer when open, hidden when closed
  // Using useIsDesktop hook (SSR-safe, reactive to window resizing)
  const isDesktop = useIsDesktop();

  // Desktop sidebar is always visible, mobile sidebar slides in/out
  const sidebarTranslate = navigationState.isSidebarOpen
    ? 'translate-x-0'
    : '-translate-x-full lg:translate-x-0';

  // Determine sidebar width based on desktop collapse state
  const sidebarWidth = isDesktop ? (navigationState.isSidebarCollapsed ? 'w-16' : 'w-64') : 'w-64';

  // isExpanded true on desktop when not collapsed, and on mobile when drawer is open
  const isExpanded = isDesktop
    ? !navigationState.isSidebarCollapsed
    : navigationState.isSidebarOpen;

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
        {/* Desktop: w-64 (full width) or w-16 (collapsed, icons only) based on user preference
            Mobile: w-64 drawer when open
            Using literal class names for Tailwind JIT compatibility */}
        <aside
          className={`fixed bottom-0 left-0 ${SIDEBAR_Z_INDEX.SIDEBAR} flex flex-col ${SIDEBAR_COLORS.BACKGROUND} shadow-lg border-r ${SIDEBAR_COLORS.BORDER} ${sidebarTranslate} overflow-y-auto overflow-x-visible transition-all ${SIDEBAR_TRANSITIONS.DURATION} ${SIDEBAR_TRANSITIONS.EASING} ${sidebarWidth}`}
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            top: 'calc(4rem + env(safe-area-inset-top, 0px))',
          }}
        >
          {/* Wrapper to ensure tooltips can overflow */}
          <div className="flex flex-col h-full min-w-0 overflow-visible">
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

            {/* Desktop Collapse Toggle Button */}
            {isDesktop && (
              <div className={`border-t border-gray-100 ${SIDEBAR_SPACING.PADDING_X} py-2 mt-auto`}>
                <button
                  onClick={toggleSidebarCollapse}
                  className={`w-full flex items-center gap-3 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition-colors duration-200 ${
                    !isExpanded ? 'justify-center' : ''
                  }`}
                  aria-label={
                    navigationState.isSidebarCollapsed
                      ? navigationLabels.SIDEBAR_EXPAND
                      : navigationLabels.SIDEBAR_COLLAPSE
                  }
                  title={navigationState.isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {navigationState.isSidebarCollapsed ? (
                    <PanelLeft className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <PanelLeftClose className="h-5 w-5 flex-shrink-0" />
                  )}
                  {isExpanded && (
                    <span>{navigationState.isSidebarCollapsed ? 'Expand' : 'Collapse'}</span>
                  )}
                </button>
              </div>
            )}

            {/* Mobile Close Button */}
            {navigationState.isSidebarOpen && !isDesktop && (
              <div className={`border-t border-gray-100 ${SIDEBAR_SPACING.PADDING_X} py-2 mt-auto`}>
                <button
                  onClick={toggleSidebar}
                  className="w-full flex items-center gap-3 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition-colors duration-200 min-h-[44px]"
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
