/**
 * @deprecated This file is deprecated. Use @/config/navigation.ts instead.
 *
 * All navigation configuration has been consolidated into navigation.ts which includes:
 * - sidebarSections (replaces navigationSections)
 * - bottomNavItems
 * - navigationLabels
 * - getHeaderNavigationItems (replaces getNavigationItems)
 * - footerNavigation
 * - userMenuItems
 * - authNavigationItems
 *
 * Migration:
 * - import { sidebarSections as navigationSections } from '@/config/navigation'
 * - import { getHeaderNavigationItems as getNavigationItems } from '@/config/navigation'
 *
 * This file will be removed in a future version.
 *
 * Last Modified: 2025-12-12
 * Last Modified Summary: Deprecated in favor of unified navigation.ts
 */

// Re-export from new location for backward compatibility
export {
  sidebarSections as navigationSections,
  bottomNavItems,
  navigationLabels,
  getHeaderNavigationItems as getNavigationItems,
  shouldShowNavigationItem,
} from './navigation';

export type { NavigationItem, NavSection, NavItem } from './navigation';
