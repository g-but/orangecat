/**
 * Sidebar Navigation Component
 *
 * Displays navigation sections and items in the sidebar
 * Uses SidebarNavItem component for DRY principle
 *
 * Created: 2025-01-07
 * Last Modified: 2025-01-27
 * Last Modified Summary: Refactored to use SidebarNavItem component for better modularity and DRY
 */

'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import type { NavSection, NavItem } from '@/hooks/useNavigation';
import { navigationLabels } from '@/config/navigation';
import { SIDEBAR_SPACING } from '@/constants/sidebar';
import { SidebarNavItem } from './SidebarNavItem';

interface SidebarNavigationProps {
  sections: NavSection[];
  bottomItems: NavItem[];
  isExpanded: boolean;
  collapsedSections: Set<string>;
  isItemActive: (href: string) => boolean;
  toggleSection: (sectionId: string) => void;
  onNavigate?: () => void;
}

export function SidebarNavigation({
  sections,
  bottomItems,
  isExpanded,
  collapsedSections,
  isItemActive,
  toggleSection,
  onNavigate,
}: SidebarNavigationProps) {
  return (
    <>
      {/* Navigation Sections */}
      <nav
        className={`flex-1 ${SIDEBAR_SPACING.PADDING_Y} ${SIDEBAR_SPACING.SECTION_SPACING} overflow-y-auto overflow-x-hidden`}
        aria-label={navigationLabels.MAIN_NAVIGATION}
      >
        {sections.map(section => {
          const isCollapsed = collapsedSections.has(section.id);
          const hasActiveItem = section.items.some(item => isItemActive(item.href));

          return (
            <div key={section.id} className={`space-y-1 sm:space-y-2 ${SIDEBAR_SPACING.PADDING_X}`}>
              {/* Section Header - shows when expanded (hover or manual) */}
              <div
                className={`flex items-center justify-between transition-all duration-200 ${isExpanded ? 'block px-0' : 'hidden lg:hidden'}`}
              >
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
                {section.collapsible && (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="p-2 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
                    aria-label={`${navigationLabels.SECTION_TOGGLE} ${section.title}`}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 sm:w-3 sm:h-3 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 sm:w-3 sm:h-3 text-gray-400" />
                    )}
                  </button>
                )}
              </div>

              {/* Section Items */}
              {(!section.collapsible || !isCollapsed || hasActiveItem) && (
                <div className="space-y-1">
                  {section.items.map(item => (
                    <SidebarNavItem
                      key={item.name}
                      item={item}
                      isActive={isItemActive(item.href)}
                      isExpanded={isExpanded}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Navigation Items */}
      {bottomItems.length > 0 && (
        <div className={`border-t border-gray-100 ${SIDEBAR_SPACING.PADDING_X} py-2 space-y-1`}>
          {bottomItems.map(item => (
            <SidebarNavItem
              key={item.name}
              item={item}
              isActive={isItemActive(item.href)}
              isExpanded={isExpanded}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </>
  );
}
