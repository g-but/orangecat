/**
 * Sidebar Component
 *
 * Main sidebar component that combines user profile and navigation
 *
 * Sidebar has only 2 states:
 * 1. Icons only (default, collapsed) - w-16
 * 2. Icons + text (expanded) - w-64
 *
 * Behavior:
 * - Default: icons only
 * - Hover: expands to icons+text, collapses on unhover (only when not manually opened)
 * - Hamburger menu: expands to icons+text, stays expanded until clicked again
 *
 * Created: 2025-01-07
 * Last Modified: 2025-01-27
 * Last Modified Summary: Simplified sidebar to two states (icons-only or icons+text)
 */

'use client';

import { Menu } from 'lucide-react';
import { useSidebarHover } from '@/hooks/useSidebarHover';
import { SidebarUserProfile } from './SidebarUserProfile';
import { SidebarNavigation } from './SidebarNavigation';
import type { NavSection, NavItem } from '@/hooks/useNavigation';
import type { Profile } from '@/types/database';
import { navigationLabels } from '@/config/navigationConfig';
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
  const { isHovered, setIsHovered, isExpanded } = useSidebarHover({
    isSidebarOpen: navigationState.isSidebarOpen,
  });

  const handleNavigate = () => {
    if (navigationState.isSidebarOpen && onNavigate) {
      onNavigate();
    }
  };

  // Determine sidebar width and visibility
  // Two states: collapsed (icons only) or expanded (icons+text)
  const isExpandedState = isExpanded; // true when manually opened OR hovered
  const sidebarWidth = isExpandedState ? SIDEBAR_WIDTHS.EXPANDED : SIDEBAR_WIDTHS.COLLAPSED;

  // Mobile: sidebar slides in/out based on isSidebarOpen
  // Desktop: sidebar is always visible, width changes based on expanded state
  const sidebarTranslate = navigationState.isSidebarOpen
    ? 'translate-x-0' // Mobile: visible when opened
    : isHovered
      ? 'translate-x-0' // Desktop: visible on hover (even when not manually opened)
      : '-translate-x-full lg:translate-x-0'; // Mobile: hidden | Desktop: visible (collapsed width)

  return (
    <aside
      className={`fixed bottom-0 left-0 ${SIDEBAR_Z_INDEX.SIDEBAR} flex flex-col ${SIDEBAR_COLORS.BACKGROUND} shadow-lg transition-all ${SIDEBAR_TRANSITIONS.DURATION} ${SIDEBAR_TRANSITIONS.EASING} border-r ${SIDEBAR_COLORS.BORDER} ${sidebarWidth} ${sidebarTranslate} overflow-y-auto overflow-x-hidden`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        top: 'calc(4rem + env(safe-area-inset-top, 0px))',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        // Only collapse on unhover if sidebar is not manually opened
        if (!navigationState.isSidebarOpen) {
          setIsHovered(false);
        }
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
