/**
 * Sidebar constants
 *
 * Centralized constants for sidebar dimensions, z-indexes, and other magic numbers
 *
 * Created: 2025-01-07
 * Last Modified: 2025-01-07
 * Last Modified Summary: Created sidebar constants file
 */

/**
 * Sidebar width constants
 */
export const SIDEBAR_WIDTHS = {
  EXPANDED: 'w-64', // 256px - Full expanded (when manually opened)
  HOVER_EXPANDED: 'w-52', // 208px - Expanded on hover to show text labels (icons + words)
  COLLAPSED: 'w-16', // 64px - Narrow with icons only (default) - just enough for icons with minimal padding
  EXPANDED_PX: 256,
  HOVER_EXPANDED_PX: 208,
  COLLAPSED_PX: 64,
} as const;

/**
 * Z-index constants for sidebar and related elements
 */
export const SIDEBAR_Z_INDEX = {
  SIDEBAR: 'z-40',
  OVERLAY: 'z-40',
  TOOLTIP: 'z-50', // Tooltips appear above sidebar but below header
  HEADER: 'z-50',
  HEADER_VALUE: 50,
  SIDEBAR_VALUE: 40,
} as const;

/**
 * Sidebar transition durations
 */
export const SIDEBAR_TRANSITIONS = {
  DURATION: 'duration-300',
  EASING: 'ease-in-out',
  DURATION_MS: 300,
} as const;

/**
 * Sidebar breakpoints
 */
export const SIDEBAR_BREAKPOINTS = {
  MOBILE: 'lg:hidden',
  DESKTOP: 'hidden lg:block',
  DESKTOP_BREAKPOINT: 1024, // lg breakpoint in Tailwind
} as const;

/**
 * Sidebar spacing constants
 */
export const SIDEBAR_SPACING = {
  PADDING_X: 'px-3 sm:px-4',
  PADDING_Y: 'py-3 sm:py-4',
  ITEM_HEIGHT: 'min-h-[44px]', // Touch-friendly minimum height
  SECTION_SPACING: 'space-y-4 sm:space-y-6',
} as const;

/**
 * Sidebar colors
 */
export const SIDEBAR_COLORS = {
  BACKGROUND: 'bg-white',
  BORDER: 'border-gray-200',
  ACTIVE_BACKGROUND: 'bg-gradient-to-r from-tiffany-100 to-tiffany-50',
  ACTIVE_TEXT: 'text-tiffany-700',
  ACTIVE_BORDER: 'border-tiffany-200',
  HOVER_BACKGROUND: 'hover:bg-gray-50',
  TEXT_PRIMARY: 'text-gray-700',
  TEXT_SECONDARY: 'text-gray-500',
} as const;
