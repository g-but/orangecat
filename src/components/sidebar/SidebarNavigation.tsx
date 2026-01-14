/**
 * Sidebar Navigation Component
 *
 * Displays navigation sections and items in the sidebar
 * Desktop: Icon-only list (section headers hidden)
 * Mobile: Full section headers with collapsible sections
 *
 * Created: 2025-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Hide section headers on desktop for fixed-width sidebar
 */

'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import type { NavSection, NavItem } from '@/hooks/useNavigation';
import { navigationLabels } from '@/config/navigation';
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
        className="flex-1 py-3 space-y-4 overflow-y-auto overflow-x-visible"
        aria-label={navigationLabels.MAIN_NAVIGATION}
      >
        {sections.map(section => {
          const isCollapsed = collapsedSections.has(section.id);
          const hasActiveItem = section.items.some(item => item.href && isItemActive(item.href));

          return (
            <div key={section.id} className="space-y-1">
              {/* Section Header - Only visible on mobile expanded */}
              {isExpanded && (
                <div className="flex items-center justify-between px-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                  {section.collapsible && (
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                      aria-label={`${navigationLabels.SECTION_TOGGLE} ${section.title}`}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Section Items - always show on desktop, respect collapse on mobile */}
              {(!isExpanded || !section.collapsible || !isCollapsed || hasActiveItem) && (
                <div className={`space-y-1 ${isExpanded ? 'px-2' : ''}`}>
                  {section.items.map(item => (
                    <SidebarNavItem
                      key={item.name}
                      item={item}
                      isActive={item.href ? isItemActive(item.href) : false}
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
        <div className={`border-t border-gray-100 py-2 space-y-1 ${isExpanded ? 'px-2' : ''}`}>
          {bottomItems.map(item => (
            <SidebarNavItem
              key={item.name}
              item={item}
              isActive={item.href ? isItemActive(item.href) : false}
              isExpanded={isExpanded}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </>
  );
}
