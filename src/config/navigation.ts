/**
 * Unified Navigation Configuration
 *
 * Single source of truth for all navigation items across the application
 * Combines header, sidebar, footer, and mobile navigation
 *
 * Entity-based navigation is generated from entity registry (single source of truth).
 * Manual sections for non-entity navigation (Home, Explore, Learn).
 *
 * Progressive disclosure: Only most-used sections expanded by default to reduce clutter.
 *
 * Created: 2025-01-07
 * Last Modified: 2025-01-30
 * Last Modified Summary: Integrated navigation generator from entity registry, applied progressive disclosure
 */

import { ComponentType, SVGProps } from 'react';
import { generateEntityNavigation } from './navigation-generator';
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
  Github,
  Twitter,
  FileText,
  Info,
  HelpCircle,
  Shield,
  Search,
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  href?: string;
  requiresAuth?: boolean;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  description?: string;
  children?: NavigationItem[]; // For dropdown menus
  external?: boolean; // For external links that open in new tab
}

export interface NavSection {
  id: string;
  title: string;
  priority: number;
  defaultExpanded?: boolean;
  collapsible?: boolean; // Whether section can be collapsed/expanded
  requiresAuth?: boolean;
  items: NavigationItem[];
}

export interface NavItem {
  name: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  description?: string;
  requiresAuth?: boolean;
}

/**
 * Get navigation items based on authentication state for header
 *
 * @param user - Supabase User object or null
 * @returns Array of navigation items appropriate for the auth state
 */
export function getHeaderNavigationItems(user: SupabaseUser | null): NavigationItem[] {
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
 * Uses navigation generator for entity-based sections (single source of truth).
 * Manual sections for non-entity navigation (Home, Explore, Learn).
 *
 * Progressive disclosure: Only most-used sections expanded by default.
 */
// Manual sections (non-entity navigation)
const manualSections: NavSection[] = [
  {
    id: 'home',
    title: 'Home',
    priority: 1,
    defaultExpanded: true, // Most used - always expanded
    collapsible: true,
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
        name: 'Search',
        href: '/discover',
        icon: Search,
        description: 'Find projects, people, and more',
        requiresAuth: false, // Search is available to all
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
];

// Generate entity-based navigation sections
const entitySections = generateEntityNavigation();

// Add "People" to Network section (not an entity type)
const networkSection = entitySections.find(s => s.id === 'network');
if (networkSection) {
  networkSection.items.push({
    name: 'People',
    href: '/dashboard/people',
    icon: Users,
    description: 'Your connections',
    requiresAuth: true,
  });
}

// Public sections (Explore, Learn)
const publicSections: NavSection[] = [
  {
    id: 'explore',
    title: 'Explore',
    priority: 6,
    defaultExpanded: false, // Collapsed - progressive disclosure
    collapsible: true,
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
  {
    id: 'learn',
    title: 'Learn',
    priority: 7,
    defaultExpanded: false, // Collapsed - progressive disclosure
    collapsible: true,
    requiresAuth: false,
    items: [
      {
        name: 'About',
        href: '/about',
        icon: Info,
        description: 'Learn about Orange Cat',
        requiresAuth: false,
      },
      {
        name: 'Blog',
        href: '/blog',
        icon: FileText,
        description: 'Latest news and updates',
        requiresAuth: false,
      },
      {
        name: 'Docs',
        href: '/docs',
        icon: BookOpen,
        description: 'Documentation and guides',
        requiresAuth: false,
      },
      {
        name: 'FAQ',
        href: '/faq',
        icon: HelpCircle,
        description: 'Frequently asked questions',
        requiresAuth: false,
      },
      {
        name: 'Privacy',
        href: '/privacy',
        icon: Shield,
        description: 'Privacy policy',
        requiresAuth: false,
      },
    ],
  },
];

// Merge all sections: manual + entity-generated + public
export const sidebarSections: NavSection[] = [
  ...manualSections,
  ...entitySections,
  ...publicSections,
].sort((a, b) => a.priority - b.priority);

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
 * Footer navigation configuration
 */
export const footerNavigation = {
  product: [
    { name: 'Features', href: '/docs#features' },
    { name: 'Documentation', href: '/docs' },
    { name: 'API Reference', href: '/docs/api' },
    { name: 'Status', href: '/status' },
  ],
  company: [
    { name: 'About BitBaum', href: '/company/about' },
    { name: 'About OrangeCat', href: '/about' },
    { name: 'Careers', href: '/company/careers' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Security', href: '/security' },
  ],
  social: [
    {
      name: 'Twitter',
      href: 'https://twitter.com/orangecat',
      icon: Twitter,
    },
    {
      name: 'GitHub',
      href: 'https://github.com/g-but/orangecat',
      icon: Github,
    },
  ],
};

/**
 * User dropdown menu items (for header user menu)
 */
export const userMenuItems = [
  { name: 'Dashboard', href: '/dashboard', requiresAuth: true },
  { name: 'Groups', href: '/dashboard/groups', requiresAuth: true, description: 'Manage Groups' },
  { name: 'Assets', href: '/dashboard/assets', requiresAuth: true, description: 'My Valuable Assets' },
  { name: 'Loans', href: '/dashboard/loans', requiresAuth: true, description: 'Peer-to-Peer Lending' },
  { name: 'Sell', href: '/dashboard/store', requiresAuth: true, description: 'Products & Services' },
  { name: 'Raise', href: '/dashboard/projects', requiresAuth: true, description: 'Projects & Causes' },
  { name: 'Network', href: '/dashboard/groups', requiresAuth: true, description: 'Groups, Events & People' },
  { name: 'Wallet', href: '/dashboard/wallets', requiresAuth: true },
  { name: 'Settings', href: '/settings', requiresAuth: true },
];

/**
 * Authentication navigation items
 */
export const authNavigationItems = [
  { name: 'Sign In', href: '/auth?mode=login' },
  { name: 'Get Started', href: '/auth?mode=register' },
];

/**
 * Navigation labels for accessibility and internationalization
 */
export const navigationLabels = {
  MAIN_NAVIGATION: 'Main navigation',
  SECTION_TOGGLE: 'Toggle section',
  COMING_SOON: 'Coming soon',
  SIDEBAR_EXPAND: 'Expand sidebar',
  SIDEBAR_COLLAPSE: 'Collapse sidebar',
} as const;