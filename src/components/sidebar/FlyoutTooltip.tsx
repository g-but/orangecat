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

import { useEffect, useState } from 'react';

interface FlyoutTooltipProps {
  isVisible: boolean;
  children: React.ReactNode;
  targetElement?: HTMLElement | null;
}

/**
 * Flyout tooltip that appears to the right of sidebar items
 * Only visible on desktop (lg: breakpoint) when hovered
 *
 * Uses fixed positioning calculated from target element to avoid clipping
 * High z-index (60) to appear above sidebar (40) and header (50)
 */
export function FlyoutTooltip({ isVisible, children, targetElement }: FlyoutTooltipProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isVisible) {
      setPosition(null);
      return;
    }

    let cleanup: (() => void) | undefined;

    // Wait a tick for ref to be available
    const timer = setTimeout(() => {
      if (!targetElement) {
        setPosition(null);
        return;
      }

      const updatePosition = () => {
        if (!targetElement) {
          return;
        }
        const rect = targetElement.getBoundingClientRect();
        setPosition({
          top: rect.top + rect.height / 2,
          left: rect.right + 8, // 8px margin from sidebar edge
        });
      };

      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();

      // Listen to scroll on all ancestors
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      cleanup = () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }, 0);

    return () => {
      clearTimeout(timer);
      if (cleanup) {
        cleanup();
      }
    };
  }, [isVisible, targetElement]);

  if (!isVisible || !position) {
    return null;
  }

  return (
    <div
      className="hidden lg:block fixed px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg whitespace-nowrap pointer-events-none shadow-xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateY(-50%)',
        zIndex: 9999, // Very high z-index to ensure it's above everything
      }}
    >
      {/* Tooltip arrow pointing left */}
      <div
        className="absolute right-full top-1/2 -translate-y-1/2"
        style={{
          borderWidth: '6px',
          borderStyle: 'solid',
          borderColor: 'transparent',
          borderRightColor: '#111827', // gray-900
        }}
      />
      {children}
    </div>
  );
}
