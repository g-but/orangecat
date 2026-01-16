/**
 * Sidebar Navigation Item Component
 *
 * Reusable component for rendering navigation items in the sidebar
 * Follows DRY principle by centralizing item rendering logic
 *
 * Fixed-width sidebar pattern with flyout tooltips:
 * - Desktop: Icon-only with flyout tooltip on hover (appears to the right)
 * - Mobile: Full text labels when drawer is open
 * - Clean, no jarring animations
 *
 * Created: 2025-01-27
 * Last Modified: 2026-01-07
 * Last Modified Summary: Replaced hover-expand with flyout tooltips for desktop
 */

'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import type { NavItem } from '@/hooks/useNavigation';
import { navigationLabels } from '@/config/navigation';
import { SIDEBAR_COLORS, SIDEBAR_SPACING } from '@/constants/sidebar';
import { useUnreadCount } from '@/stores/messaging';
import { FlyoutTooltip } from './FlyoutTooltip';

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  isExpanded: boolean;
  onNavigate?: () => void;
}

/**
 * Reusable sidebar navigation item component
 *
 * Fixed-width pattern:
 * - Desktop (collapsed): Icon centered with flyout tooltip on hover
 * - Mobile (expanded): Icon + text inline
 */
export function SidebarNavItem({ item, isActive, isExpanded, onNavigate }: SidebarNavItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const showMessagesBadge = item.href === '/messages';
  // Always call hooks unconditionally to follow Rules of Hooks
  const unreadCount = useUnreadCount();
  const count = showMessagesBadge ? unreadCount : 0;

  const linkClasses = [
    'group flex items-center py-2.5 text-sm font-medium rounded-xl transition-colors duration-150 relative',
    SIDEBAR_SPACING.ITEM_HEIGHT,
    // When expanded (mobile): full width with padding
    // When collapsed (desktop): centered icon
    isExpanded ? 'px-3' : 'justify-center mx-2',
    isActive
      ? `${SIDEBAR_COLORS.ACTIVE_BACKGROUND} ${SIDEBAR_COLORS.ACTIVE_TEXT} shadow-sm border ${SIDEBAR_COLORS.ACTIVE_BORDER}`
      : item.comingSoon
        ? `text-gray-600 ${SIDEBAR_COLORS.HOVER_BACKGROUND} hover:text-gray-800` // Improved contrast
        : `text-gray-700 ${SIDEBAR_COLORS.HOVER_BACKGROUND} hover:text-gray-900`, // Improved contrast
  ].join(' ');

  const iconClasses = [
    'h-5 w-5 shrink-0 transition-colors',
    isActive
      ? 'text-tiffany-600'
      : item.comingSoon
        ? 'text-gray-500 group-hover:text-gray-600' // Improved contrast for accessibility
        : 'text-gray-500 group-hover:text-gray-700', // Improved contrast: gray-500 meets WCAG AA (4.5:1)
  ].join(' ');

  return (
    <div
      className="relative overflow-visible"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={item.href || '#'}
        className={linkClasses}
        onClick={onNavigate}
        aria-label={item.comingSoon ? `${item.name} - ${navigationLabels.COMING_SOON}` : item.name}
      >
        {item.icon && <item.icon className={iconClasses} />}

        {/* Collapsed (desktop): tiny unread dot for Messages */}
        {showMessagesBadge && count > 0 && !isExpanded && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-white"></span>
        )}

        {/* Expanded (mobile): Show text labels inline */}
        {isExpanded && (
          <div className="flex-1 min-w-0 ml-3">
            <span className="whitespace-nowrap overflow-hidden text-ellipsis block">
              {item.name}
            </span>
            {item.description && (
              <span className="block text-xs text-gray-500 mt-0.5 leading-tight line-clamp-1">
                {item.description}
              </span>
            )}
          </div>
        )}

        {/* Active indicator - only visible on mobile expanded */}
        {isActive && isExpanded && (
          <div className="absolute right-3 w-2 h-2 bg-tiffany-500 rounded-full" />
        )}

        {/* Coming soon badge - mobile only */}
        {item.comingSoon && isExpanded && (
          <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            Soon
          </span>
        )}

        {/* Static badge - mobile only */}
        {item.badge && !item.comingSoon && isExpanded && (
          <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
            {item.badge}
          </span>
        )}

        {/* Dynamic messages unread badge - mobile only */}
        {showMessagesBadge && count > 0 && isExpanded && (
          <span className="ml-auto text-xs bg-sky-500 text-white px-2 py-0.5 rounded-full font-medium">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>

      {/* Flyout Tooltip - Desktop only, appears on hover to the right of icon */}
      {!isExpanded && isHovered && (
        <FlyoutTooltip isVisible={true} targetElement={itemRef.current}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.name}</span>

            {/* Show badges in tooltip */}
            {item.comingSoon && (
              <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">Soon</span>
            )}
            {item.badge && !item.comingSoon && (
              <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded font-medium">
                {item.badge}
              </span>
            )}
            {showMessagesBadge && count > 0 && (
              <span className="text-xs bg-sky-500 text-white px-1.5 py-0.5 rounded font-medium">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </div>
        </FlyoutTooltip>
      )}
    </div>
  );
}
