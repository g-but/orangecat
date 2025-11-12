/**
 * Sidebar Navigation Item Component
 *
 * Reusable component for rendering navigation items in the sidebar
 * Follows DRY principle by centralizing item rendering logic
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Created reusable sidebar navigation item component
 */

'use client';

import Link from 'next/link';
import type { NavItem } from '@/hooks/useNavigation';
import { navigationLabels } from '@/config/navigationConfig';
import { SIDEBAR_COLORS, SIDEBAR_SPACING } from '@/constants/sidebar';

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  isExpanded: boolean;
  onNavigate?: () => void;
}

/**
 * Reusable sidebar navigation item component
 *
 * Handles rendering of individual navigation items with consistent styling
 * Supports both collapsed (icons only) and expanded (icons + text) states
 */
export function SidebarNavItem({ item, isActive, isExpanded, onNavigate }: SidebarNavItemProps) {
  const linkClasses = [
    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative',
    SIDEBAR_SPACING.ITEM_HEIGHT,
    isActive
      ? `${SIDEBAR_COLORS.ACTIVE_BACKGROUND} ${SIDEBAR_COLORS.ACTIVE_TEXT} shadow-sm border ${SIDEBAR_COLORS.ACTIVE_BORDER}`
      : item.comingSoon
        ? 'text-gray-400 cursor-not-allowed'
        : `${SIDEBAR_COLORS.TEXT_PRIMARY} ${SIDEBAR_COLORS.HOVER_BACKGROUND} hover:text-gray-900`,
    isExpanded ? '' : 'lg:justify-center',
  ].join(' ');

  const iconClasses = [
    'h-5 w-5 shrink-0 transition-colors',
    isActive
      ? 'text-tiffany-600'
      : item.comingSoon
        ? 'text-gray-400'
        : 'text-gray-400 group-hover:text-gray-600',
  ].join(' ');

  const textClasses = [
    'transition-all duration-200 whitespace-nowrap',
    isExpanded
      ? 'block opacity-100 ml-3'
      : 'hidden lg:block lg:opacity-0 lg:max-w-0 lg:overflow-hidden',
  ].join(' ');

  return (
    <Link
      href={item.comingSoon ? '#' : item.href}
      className={linkClasses}
      title={isExpanded ? undefined : item.name}
      onClick={e => {
        if (item.comingSoon) {
          e.preventDefault();
        } else if (onNavigate) {
          onNavigate();
        }
      }}
      aria-label={item.comingSoon ? `${item.name} - ${navigationLabels.COMING_SOON}` : item.name}
    >
      <item.icon className={iconClasses} />

      <span className={textClasses}>{item.name}</span>

      {/* Active indicator */}
      {isActive && (
        <div
          className={`absolute right-3 w-2 h-2 bg-tiffany-500 rounded-full ${
            isExpanded ? 'block' : 'hidden lg:block lg:opacity-0'
          }`}
        />
      )}

      {/* Coming soon badge */}
      {item.comingSoon && isExpanded && (
        <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          Soon
        </span>
      )}

      {/* Badge */}
      {item.badge && !item.comingSoon && isExpanded && (
        <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
