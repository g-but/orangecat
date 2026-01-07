/**
 * Flyout Tooltip Component
 *
 * Reusable tooltip that appears to the right of sidebar items on desktop hover.
 * Extracted to follow DRY principle - used by SidebarNavItem and SidebarUserProfile.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Created shared flyout tooltip component
 */

'use client';

import { SIDEBAR_Z_INDEX } from '@/constants/sidebar';

interface FlyoutTooltipProps {
  isVisible: boolean;
  children: React.ReactNode;
}

/**
 * Flyout tooltip that appears to the right of sidebar items
 * Only visible on desktop (lg: breakpoint) when hovered
 */
export function FlyoutTooltip({ isVisible, children }: FlyoutTooltipProps) {
  if (!isVisible) {return null;}

  return (
    <div
      className="hidden lg:block absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none shadow-xl animate-in fade-in slide-in-from-left-2 duration-150"
      style={{
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: SIDEBAR_Z_INDEX.FLYOUT_TOOLTIP,
      }}
    >
      {/* Tooltip arrow */}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900" />
      {children}
    </div>
  );
}
