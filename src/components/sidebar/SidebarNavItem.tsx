/**
 * Sidebar Navigation Item Component
 *
 * Reusable component for rendering navigation items in the sidebar
 * Follows DRY principle by centralizing item rendering logic
 *
 * Hover-to-expand pattern:
 * - When collapsed: shows icon only
 * - On sidebar hover: sidebar expands and text labels appear inline
 * - When manually expanded: shows icon + text inline (full width)
 * - Tooltip fallback: shows tooltip on mobile when sidebar is collapsed
 *
 * Created: 2025-01-27
 * Last Modified: 2025-12-12
 * Last Modified Summary: Updated to work with hover-to-expand sidebar pattern
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { NavItem } from '@/hooks/useNavigation';
import { navigationLabels } from '@/config/navigation';
import { SIDEBAR_COLORS, SIDEBAR_SPACING } from '@/constants/sidebar';
import { useUnreadCount } from '@/stores/messaging';

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  isExpanded: boolean;
  onNavigate?: () => void;
}

/**
 * Reusable sidebar navigation item component
 *
 * Hover-to-expand pattern:
 * - When collapsed: shows icon only
 * - When expanded (hover or manual): shows icon + text inline
 * - Tooltip: only shows on mobile when collapsed (fallback)
 */
export function SidebarNavItem({ item, isActive, isExpanded, onNavigate }: SidebarNavItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const showMessagesBadge = item.href === '/messages';
  // Always call hooks unconditionally to follow Rules of Hooks
  const unreadCount = useUnreadCount();
  const count = showMessagesBadge ? unreadCount : 0;

  const linkClasses = [
    'group flex items-center py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative',
    SIDEBAR_SPACING.ITEM_HEIGHT,
    // Consistent horizontal padding
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

  // Text appears inline when expanded (hover or manual), smoothly transitions
  const textClasses = [
    'transition-all duration-200 whitespace-nowrap overflow-hidden text-ellipsis block',
  ].join(' ');

  return (
    <div
      className="relative"
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={item.href}
        className={linkClasses}
        onClick={onNavigate}
        aria-label={item.comingSoon ? `${item.name} - ${navigationLabels.COMING_SOON}` : item.name}
      >
        <item.icon className={iconClasses} />

        {/* Collapsed sidebar: tiny unread dot for Messages */}
        {showMessagesBadge && count > 0 && !isExpanded && (
          <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-sky-500"></span>
        )}

        {isExpanded && (
          <div className="flex-1 min-w-0 ml-3">
            <span className={textClasses}>{item.name}</span>
            {/* Description - shown when expanded, especially helpful on mobile */}
            {item.description && (
              <span className="block text-xs text-gray-500 mt-0.5 leading-tight line-clamp-1">
                {item.description}
              </span>
            )}
          </div>
        )}

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

      {/* Tooltip: only shows on mobile when collapsed (desktop uses sidebar hover expansion) */}
      {!isExpanded && isHovered && (
        <div
          className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none shadow-lg lg:hidden"
          style={{
            // Position tooltip vertically centered with the icon
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 50, // Above sidebar, below header
            animation: 'fadeInScale 150ms ease-out',
          }}
        >
          {item.name}
          {/* Tooltip arrow pointing left */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-900" />
        </div>
      )}
    </div>
  );
}
