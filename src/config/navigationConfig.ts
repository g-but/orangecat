import {
  LayoutDashboard,
  UserCircle,
  Handshake,
  Briefcase,
  Settings,
  Edit3,
  Users,
  Home,
  TrendingUp,
  Zap,
  Sparkles,
  Rocket,
} from 'lucide-react';
import { NavSection, NavItem } from '@/hooks/useNavigation';

// Enhanced navigation structure with better UX flow and information architecture
export const navigationSections: NavSection[] = [
  {
    id: 'main',
    title: 'Main',
    priority: 1,
    defaultExpanded: true,
    requiresAuth: true,
    items: [
      {
        name: 'Home',
        href: '/dashboard',
        icon: Home,
        description: 'Your main home overview',
        requiresAuth: true,
      },
      {
        name: 'Projects',
        href: '/dashboard/projects',
        icon: Handshake,
        description: 'Manage your Bitcoin projects and initiatives',
        requiresAuth: true,
      },
    ],
  },
  {
    id: 'social',
    title: 'Social & Collaboration',
    priority: 2,
    defaultExpanded: true,
    requiresAuth: true,
    items: [
      {
        name: 'People',
        href: '/dashboard/people',
        icon: Users,
        description: 'Connect with Bitcoin enthusiasts',
        requiresAuth: true,
      },
    ],
  },
  {
    id: 'upcoming',
    title: 'Coming Soon',
    priority: 3,
    defaultExpanded: false,
    collapsible: true,
    requiresAuth: true,
    items: [],
  },
];

// Bottom navigation items for account management
export const bottomNavItems: NavItem[] = [
  {
    name: 'Edit Profile',
    href: '/profile',
    icon: Edit3,
    description: 'Update your profile information',
    requiresAuth: true,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account and security settings',
    requiresAuth: true,
  },
];

// Navigation analytics events for tracking user behavior
export const navigationEvents = {
  SIDEBAR_TOGGLE: 'navigation_sidebar_toggle',
  SECTION_TOGGLE: 'navigation_section_toggle',
  ITEM_CLICK: 'navigation_item_click',
  COMING_SOON_CLICK: 'navigation_coming_soon_click',
} as const;

// Navigation accessibility labels
export const navigationLabels = {
  SIDEBAR_TOGGLE: 'Toggle navigation sidebar',
  SIDEBAR_EXPAND: 'Expand navigation sidebar',
  SIDEBAR_COLLAPSE: 'Collapse navigation sidebar',
  SECTION_TOGGLE: 'Toggle navigation section',
  MAIN_NAVIGATION: 'Main navigation',
  BOTTOM_NAVIGATION: 'Account navigation',
  COMING_SOON: 'Feature coming soon',
} as const;

// Navigation keyboard shortcuts
export const navigationShortcuts = {
  TOGGLE_SIDEBAR: 'cmd+b',
  GO_TO_HOME: 'cmd+1',
  GO_TO_CAMPAIGNS: 'cmd+2',
  GO_TO_PROJECTS: 'cmd+3',
  GO_TO_PEOPLE: 'cmd+4',
  GO_TO_ORGANIZATIONS: 'cmd+5',
  GO_TO_SETTINGS: 'cmd+,',
} as const;
