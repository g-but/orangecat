/**
 * Centralized Z-Index Management
 *
 * Single source of truth for all z-index values across the application
 * Prevents z-index conflicts and provides clear layering hierarchy
 *
 * Created: 2025-12-12
 * Last Modified: 2025-12-12
 * Last Modified Summary: Created centralized z-index constants to eliminate z-index chaos
 */

/**
 * Z-Index layers organized by UI component hierarchy
 * Higher numbers appear above lower numbers
 */
export const Z_INDEX = {
  // Base content layer (default)
  BASE: 0,

  // Content layers
  STICKY_CONTENT: 10,
  ELEVATED_CONTENT: 20,

  // Navigation layers
  SIDEBAR: 30,
  HEADER: 40,
  MOBILE_BOTTOM_NAV: 45,

  // Overlay layers (modals, dropdowns, tooltips)
  DROPDOWN: 50,
  OVERLAY: 50,
  TOOLTIP: 60,
  SEARCH_MODAL: 60,
  MODAL: 70,
  NOTIFICATION: 75,

  // Critical overlays (mobile menus, full-screen overlays)
  MOBILE_MENU_BACKDROP: 80,
  MOBILE_MENU: 90,
  FULLSCREEN_OVERLAY: 90,

  // System layers (toasts, loading states)
  TOAST: 100,
  LOADING: 110,

  // Debug/development layers
  DEBUG: 1000,
} as const;

/**
 * Z-index class names for Tailwind CSS
 * Use these instead of arbitrary values like z-[9999]
 */
export const Z_INDEX_CLASSES = {
  // Base content layer
  BASE: 'z-0',

  // Content layers
  STICKY_CONTENT: 'z-10',
  ELEVATED_CONTENT: 'z-20',

  // Navigation layers
  SIDEBAR: 'z-30',
  HEADER: 'z-40',
  MOBILE_BOTTOM_NAV: 'z-[45]',

  // Overlay layers
  DROPDOWN: 'z-50',
  OVERLAY: 'z-50',
  TOOLTIP: 'z-[60]',
  SEARCH_MODAL: 'z-[60]',
  MODAL: 'z-[70]',
  NOTIFICATION: 'z-[75]',

  // Critical overlays
  MOBILE_MENU_BACKDROP: 'z-[80]',
  MOBILE_MENU: 'z-[90]',
  FULLSCREEN_OVERLAY: 'z-[90]',

  // System layers
  TOAST: 'z-[100]',
  LOADING: 'z-[110]',

  // Debug layers
  DEBUG: 'z-[1000]',
} as const;

/**
 * Get the appropriate z-index for a component type
 * Useful for dynamic z-index assignment
 */
export function getZIndex(layer: keyof typeof Z_INDEX): number {
  return Z_INDEX[layer];
}

/**
 * Get the appropriate z-index class for a component type
 * Useful for Tailwind class assignment
 */
export function getZIndexClass(layer: keyof typeof Z_INDEX_CLASSES): string {
  return Z_INDEX_CLASSES[layer];
}















