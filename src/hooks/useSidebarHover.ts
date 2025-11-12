/**
 * Hook for sidebar hover expansion behavior
 *
 * Handles:
 * - Hover state for desktop sidebar expansion
 * - Determines if sidebar should appear expanded (open OR hovered)
 * - When manually opened via hamburger, hover does not collapse it
 * - When collapsed, hover expands it temporarily
 *
 * Created: 2025-01-07
 * Last Modified: 2025-01-27
 * Last Modified Summary: Simplified sidebar expansion logic to two states (icons-only or icons+text)
 */

import { useState } from 'react';

interface UseSidebarHoverOptions {
  isSidebarOpen: boolean;
}

interface UseSidebarHoverReturn {
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
  isExpanded: boolean; // True if sidebar is open OR hovered (shows icons+text)
}

/**
 * Hook to manage sidebar hover state and expansion logic
 *
 * Sidebar has only 2 states:
 * 1. Icons only (default, collapsed)
 * 2. Icons + text (expanded via hover or hamburger menu)
 *
 * Behavior:
 * - Default: icons only
 * - Hover: expands to icons+text, collapses on unhover (only when not manually opened)
 * - Hamburger menu: expands to icons+text, stays expanded until clicked again
 *
 * @param options - Configuration options
 * @returns Hover state and expansion logic
 */
export function useSidebarHover({ isSidebarOpen }: UseSidebarHoverOptions): UseSidebarHoverReturn {
  const [isHovered, setIsHovered] = useState(false);

  // Sidebar is expanded (shows icons+text) if it's manually opened OR if it's hovered
  // When manually opened, it stays expanded regardless of hover state
  const isExpanded = isSidebarOpen || isHovered;

  return {
    isHovered,
    setIsHovered,
    isExpanded,
  };
}
