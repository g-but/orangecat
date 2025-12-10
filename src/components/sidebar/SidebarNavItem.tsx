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
import { useMessagesUnread } from '@/hooks/useMessagesUnread';

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
  const showMessagesBadge = item.href === '/messages';
  const { count } = showMessagesBadge ? useMessagesUnread(30000) : { count: 0 } as any;
  const linkClasses = [
    'group flex items-center py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative',
    SIDEBAR_SPACING.ITEM_HEIGHT,
    // Consistent horizontal padding: match bottom items alignment
    // When collapsed: no padding, centered
    // When expanded: px-3 for left alignment
    isExpanded ? 'px-3' : 'px-0 lg:justify-center',
    isActive
      ? `${SIDEBAR_COLORS.ACTIVE_BACKGROUND} ${SIDEBAR_COLORS.ACTIVE_TEXT} shadow-sm border ${SIDEBAR_COLORS.ACTIVE_BORDER}`
      : item.comingSoon
        ? `text-gray-500 ${SIDEBAR_COLORS.HOVER_BACKGROUND} hover:text-gray-700`
        : `${SIDEBAR_COLORS.TEXT_PRIMARY} ${SIDEBAR_COLORS.HOVER_BACKGROUND} hover:text-gray-900`,
  ].join(' ');

  const iconClasses = [
    'h-5 w-5 shrink-0 transition-colors',
    // Ensure icon is centered when collapsed
    isExpanded ? '' : 'lg:mx-auto',
    isActive
      ? 'text-tiffany-600'
      : item.comingSoon
        ? 'text-gray-400 group-hover:text-gray-500'
        : 'text-gray-400 group-hover:text-gray-600',
  ].join(' ');

  const textClasses = [
    'transition-all duration-200 whitespace-nowrap overflow-hidden text-ellipsis',
    isExpanded
      ? 'block opacity-100 ml-3 flex-1 min-w-0'
      : 'hidden lg:block lg:opacity-0 lg:max-w-0 lg:overflow-hidden',
  ].join(' ');

  return (
    <Link
      href={item.href}
      className={linkClasses}
      title={isExpanded ? undefined : item.name}
      onClick={onNavigate}
      aria-label={item.comingSoon ? `${item.name} - ${navigationLabels.COMING_SOON}` : item.name}
    >
      <item.icon className={iconClasses} />

      {/* Collapsed sidebar: tiny unread dot for Messages */}
      {showMessagesBadge && count > 0 && !isExpanded && (
        <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-sky-500"></span>
      )}

      <span className={textClasses}>{item.name}</span>

      {/* Active indicator */}
      {isActive && (
        <div
          className={`absolute w-2 h-2 bg-tiffany-500 rounded-full ${
            isExpanded ? 'right-3 block' : 'hidden lg:block lg:opacity-0'
          }`}
        />
      )}

      {/* Coming soon badge */}
      {item.comingSoon && isExpanded && (
        <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          Soon
        </span>
      )}

      {/* Static badge */}
      {item.badge && !item.comingSoon && isExpanded && (
        <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
          {item.badge}
        </span>
      )}

      {/* Dynamic messages unread badge */}
      {showMessagesBadge && count > 0 && isExpanded && (
        <span className="ml-auto text-xs bg-sky-500 text-white px-2 py-0.5 rounded-full font-medium">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
