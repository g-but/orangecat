/**
 * Sidebar Component
 *
 * Main sidebar component that combines user profile and navigation
 *
 * Hover-to-expand pattern:
 * - Sidebar defaults to icons only (w-16) when collapsed
 * - On hover: expands to show text labels (w-52) smoothly
 * - Manual toggle: expands to full width (w-64) and stays expanded
 * - Always visible when user is logged in
 *
 * Sidebar states:
 * 1. Icons only (default, collapsed) - w-16
 * 2. Icons + text on hover - w-52 (temporary, on hover)
 * 3. Icons + text (manually expanded) - w-64 (persistent)
 *
 * Behavior:
 * - Default: icons only (w-16 fixed)
 * - Hover: expands to w-52 to show text labels (smooth transition)
 * - Hamburger menu: expands to w-64, stays expanded until clicked again
 * - Mobile: slides in/out, no hover expansion
 *
 * Created: 2025-01-07
 * Last Modified: 2025-12-12
 * Last Modified Summary: Changed to hover-to-expand pattern - sidebar expands on hover to show text labels
 */

'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { SidebarUserProfile } from './SidebarUserProfile';
import { SidebarNavigation } from './SidebarNavigation';
import type { NavSection, NavItem } from '@/hooks/useNavigation';
import type { Profile } from '@/types/database';
import { navigationLabels } from '@/config/navigation';
import {
  SIDEBAR_WIDTHS,
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
    collapsedSections: Set<string>;
  };
  isItemActive: (href: string) => boolean;
  toggleSidebar: () => void;
  toggleSection: (sectionId: string) => boolean;
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
  const [isHovered, setIsHovered] = useState(false);

  const handleNavigate = () => {
    if (navigationState.isSidebarOpen && onNavigate) {
      onNavigate();
    }
  };

  // Sidebar width logic:
  // - If manually opened: w-64 (full expanded)
  // - If hovered (and not manually opened): w-52 (show text labels) - DESKTOP ONLY
  // - Otherwise: w-16 (icons only) - DESKTOP ONLY
  // - MOBILE: Always w-64 (full expanded) when visible
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const sidebarWidth = isMobile && navigationState.isSidebarOpen
    ? SIDEBAR_WIDTHS.EXPANDED  // Mobile: always full width when open
    : navigationState.isSidebarOpen 
      ? SIDEBAR_WIDTHS.EXPANDED  // Desktop: w-64 when manually opened
      : isHovered
        ? SIDEBAR_WIDTHS.HOVER_EXPANDED  // Desktop: w-52 on hover
        : SIDEBAR_WIDTHS.COLLAPSED; // Desktop: w-16 when collapsed (default)

  // Mobile: sidebar slides in/out based on isSidebarOpen
  // Desktop: sidebar is always visible
  const sidebarTranslate = navigationState.isSidebarOpen
    ? 'translate-x-0' // Mobile: visible when opened
    : '-translate-x-full lg:translate-x-0'; // Mobile: hidden | Desktop: visible

  // isExpanded controls whether text labels are shown
  // - Mobile: Always expanded when sidebar is visible (never icon-only)
  // - Desktop: Expanded when manually opened OR when hovered
  const isExpanded = isMobile && navigationState.isSidebarOpen
    ? true  // Mobile: always show labels when sidebar is open
    : navigationState.isSidebarOpen || (isHovered && !isMobile); // Desktop: manual open or hover

  return (
    <aside
      className={`fixed bottom-0 left-0 ${SIDEBAR_Z_INDEX.SIDEBAR} flex flex-col ${SIDEBAR_COLORS.BACKGROUND} shadow-lg transition-all ${SIDEBAR_TRANSITIONS.DURATION} ${SIDEBAR_TRANSITIONS.EASING} border-r ${SIDEBAR_COLORS.BORDER} ${sidebarWidth} ${sidebarTranslate} overflow-y-auto overflow-x-hidden lg:overflow-x-visible`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

        {/* Toggle Button - Desktop only */}
        <div className={`border-t border-gray-100 ${SIDEBAR_SPACING.PADDING_X} py-2 hidden lg:block mt-auto`}>
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center justify-center p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition-all duration-200 ${isExpanded ? '' : 'lg:px-0'}`}
            aria-label={
              navigationState.isSidebarOpen
                ? navigationLabels.SIDEBAR_COLLAPSE
                : navigationLabels.SIDEBAR_EXPAND
            }
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        
        {/* Mobile Close Button - Visible when sidebar is open on mobile */}
        {navigationState.isSidebarOpen && (
          <div className={`border-t border-gray-100 ${SIDEBAR_SPACING.PADDING_X} py-2 lg:hidden mt-auto`}>
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition-all duration-200"
              aria-label={navigationLabels.SIDEBAR_COLLAPSE}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
