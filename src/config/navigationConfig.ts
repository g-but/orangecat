/**
 * Centralized navigation configuration
 *
 * Single source of truth for all navigation items across the application
 *
 * Created: 2025-01-07
 * Last Modified: 2025-01-07
 * Last Modified Summary: Added sidebar navigation config (navigationSections, bottomNavItems, navigationLabels)
 */

import { ComponentType, SVGProps } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Home,
  Users,
  Rocket,
  Settings,
  User,
  Compass,
  BookOpen,
  Globe,
  Wallet,
  Info,
} from 'lucide-react';
import type { NavSection, NavItem } from '@/hooks/useNavigation';

export interface NavigationItem {
  name: string;
  href?: string;
  requiresAuth?: boolean;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  description?: string;
  children?: NavigationItem[]; // For dropdown menus
}

/**
 * Get navigation items based on authentication state
 *
 * @param user - Supabase User object or null
 * @returns Array of navigation items appropriate for the auth state
 */
export function getNavigationItems(user: User | null): NavigationItem[] {
  if (user) {
    return [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Discover', href: '/discover' },
      { name: 'Community', href: '/community' },
    ];
  }

  // Simplified navigation for logged-out users - mobile-first approach
  return [
    { name: 'Discover', href: '/discover' },
    { name: 'Community', href: '/community' },
    { name: 'About', href: '/about' },
  ];
}

/**
 * Check if a navigation item should be shown based on auth state
 */
export function shouldShowNavigationItem(item: NavigationItem, user: User | null): boolean {
  if (item.requiresAuth) {
    return user !== null;
  }
  return true;
}

/**
 * Sidebar navigation sections for authenticated users
 *
 * Navigation items with "My" prefix for personal items:
 * Order matches public profile tabs: Dashboard, Info, Projects, People, Wallets
 */
export const navigationSections: NavSection[] = [
  {
    id: 'main',
    title: 'Main',
    priority: 1,
    defaultExpanded: true,
    requiresAuth: true,
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        description: 'Your main dashboard',
        requiresAuth: true,
      },
      {
        name: 'My Info',
        href: '/dashboard/info',
        icon: Info,
        description: 'View your profile information',
        requiresAuth: true,
      },
      {
        name: 'My Timeline',
        href: '/timeline',
        icon: BookOpen,
        description: 'Manage your timeline and posts',
        requiresAuth: true,
      },
      {
        name: 'My Projects',
        href: '/dashboard/projects',
        icon: Rocket,
        description: 'Your projects dashboard',
        requiresAuth: true,
      },
      {
        name: 'My People',
        href: '/dashboard/people',
        icon: Users,
        description: 'People you are connected to',
        requiresAuth: true,
      },
      {
        name: 'My Wallets',
        href: '/dashboard/wallets',
        icon: Wallet,
        description: 'Manage your Bitcoin wallets',
        requiresAuth: true,
      },
    ],
  },
  {
    id: 'explore',
    title: 'Explore',
    priority: 2,
    defaultExpanded: true,
    requiresAuth: false,
    items: [
      {
        name: 'Discover',
        href: '/discover',
        icon: Compass,
        description: 'Discover projects and people',
        requiresAuth: false,
      },
      {
        name: 'Community',
        href: '/community',
        icon: Globe,
        description: 'Public timeline and community posts',
        requiresAuth: false,
      },
    ],
  },
];

/**
 * Bottom navigation items for account management
 *
 * These appear at the bottom of the sidebar
 */
export const bottomNavItems: NavItem[] = [
  {
    name: 'View My Profile',
    href: '/profiles/me',
    icon: User,
    description: 'View your public profile',
    requiresAuth: true,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account settings and preferences',
    requiresAuth: true,
  },
];

/**
 * Navigation labels for accessibility and internationalization
 *
 * Used for ARIA labels and screen reader announcements
 */
export const navigationLabels = {
  MAIN_NAVIGATION: 'Main navigation',
  SECTION_TOGGLE: 'Toggle section',
  COMING_SOON: 'Coming soon',
  SIDEBAR_EXPAND: 'Expand sidebar',
  SIDEBAR_COLLAPSE: 'Collapse sidebar',
} as const;
