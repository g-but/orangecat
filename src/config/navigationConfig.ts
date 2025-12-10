/**
 * Centralized navigation configuration
 *
 * Single source of truth for all navigation items across the application
 *
 * Created: 2025-01-07
 * Last Modified: 2025-12-02
 * Last Modified Summary: Added Personal Economy navigation (Store, Services, Causes, Cat) with clear categories
 */

import { ComponentType, SVGProps } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  Home,
  Users,
  Rocket,
  Settings,
  User as UserIcon,
  MessageSquare,
  Compass,
  BookOpen,
  Globe,
  Wallet,
  Package,
  Briefcase,
  Heart,
  Banknote,
  CircleDot,
  Building,
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
export function getNavigationItems(user: SupabaseUser | null): NavigationItem[] {
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
export function shouldShowNavigationItem(item: NavigationItem, user: SupabaseUser | null): boolean {
  if (item.requiresAuth) {
    return user !== null;
  }
  return true;
}

/**
 * Sidebar navigation sections for authenticated users
 *
 * Simplified to 6 unified sections (one verb per section):
 * 1. Home - Your unified dashboard (activity, timeline, profile)
 * 2. Sell - Products and services for Bitcoin
 * 3. Raise - All fundraising (projects, causes)
 * 4. Network - Trust networks and P2P finance (circles, loans, people)
 * 5. Wallet - Your Bitcoin wallets
 * 6. Explore - Public discovery (discover, community feed)
 */
export const navigationSections: NavSection[] = [
  {
    id: 'home',
    title: 'Home',
    priority: 1,
    defaultExpanded: true,
    requiresAuth: true,
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        description: 'Your activity overview',
        requiresAuth: true,
      },
      {
        name: 'Timeline',
        href: '/timeline',
        icon: BookOpen,
        description: 'Your posts and updates',
        requiresAuth: true,
      },
      {
        name: 'Messages',
        href: '/messages',
        icon: MessageSquare,
        description: 'Private conversations',
        requiresAuth: true,
      },
      {
        name: 'Profile',
        href: '/dashboard/info',
        icon: UserIcon,
        description: 'Your public profile',
        requiresAuth: true,
      },
    ],
  },
  {
    id: 'sell',
    title: 'Sell',
    priority: 2,
    defaultExpanded: true,
    requiresAuth: true,
    items: [
      {
        name: 'Products',
        href: '/dashboard/store',
        icon: Package,
        description: 'Physical and digital goods',
        requiresAuth: true,
      },
      {
        name: 'Services',
        href: '/dashboard/services',
        icon: Briefcase,
        description: 'Skills and expertise',
        requiresAuth: true,
      },
    ],
  },
  {
    id: 'raise',
    title: 'Raise',
    priority: 3,
    defaultExpanded: true,
    requiresAuth: true,
    items: [
      {
        name: 'Projects',
        href: '/dashboard/projects',
        icon: Rocket,
        description: 'Crowdfunding campaigns',
        requiresAuth: true,
      },
      {
        name: 'Causes',
        href: '/dashboard/causes',
        icon: Heart,
        description: 'Charitable fundraising',
        requiresAuth: true,
      },
    ],
  },
  {
    id: 'network',
    title: 'Network',
    priority: 4,
    defaultExpanded: true,
    requiresAuth: true,
    items: [
      {
        name: 'Organizations',
        href: '/organizations',
        icon: Building,
        description: 'Teams, circles & governance',
        requiresAuth: true,
      },
      // Network is only for people and circles
      {
        name: 'People',
        href: '/dashboard/people',
        icon: Users,
        description: 'Your connections',
        requiresAuth: true,
      },
    ],
  },
  {
    id: 'manage',
    title: 'Manage',
    priority: 5,
    defaultExpanded: true,
    requiresAuth: true,
    items: [
      {
        name: 'Wallets',
        href: '/dashboard/wallets',
        icon: Wallet,
        description: 'Bitcoin wallets and balances',
        requiresAuth: true,
      },
      {
        name: 'Organizations',
        href: '/organizations',
        icon: Building,
        description: 'Manage teams and governance',
        requiresAuth: true,
      },
      {
        name: 'Assets',
        href: '/assets',
        icon: Briefcase,
        description: 'List assets and manage collateral',
        requiresAuth: true,
      },
      {
        name: 'Loans',
        href: '/loans',
        icon: Banknote,
        description: 'Peer-to-peer lending marketplace',
        requiresAuth: true,
      },
    ],
  },
  {
    id: 'explore',
    title: 'Explore',
    priority: 6,
    defaultExpanded: true,
    requiresAuth: false,
    items: [
      {
        name: 'Discover',
        href: '/discover',
        icon: Compass,
        description: 'Find projects and people',
        requiresAuth: false,
      },
      {
        name: 'Community',
        href: '/community',
        icon: Globe,
        description: 'Public timeline',
        requiresAuth: false,
      },
      {
        name: 'Channel',
        href: '/channel',
        icon: BookOpen,
        description: 'Video & audio (coming soon)',
        comingSoon: true,
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
    icon: UserIcon,
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
