import {
  LayoutDashboard,
  UserCircle,
  Handshake,
  Building,
  Briefcase,
  Settings,
  Edit3,
  Calendar,
  Users,
  Wallet,
  Home,
  TrendingUp,
  Zap,
  Sparkles,
} from 'lucide-react'
import { NavSection, NavItem } from '@/hooks/useNavigation'

// Enhanced navigation structure with better UX flow and information architecture
export const navigationSections: NavSection[] = [
  {
    id: 'core',
    title: 'Core',
    priority: 1,
    defaultExpanded: true,
    requiresAuth: true,
    items: [
      { 
        name: 'Dashboard', 
        href: '/dashboard', 
        icon: LayoutDashboard, 
        description: 'Your main dashboard overview',
        requiresAuth: true
      },
      { 
        name: 'Profile', 
        href: '/profile/me', 
        icon: UserCircle, 
        description: 'Your public profile page',
        requiresAuth: true
      },
    ]
  },
  {
    id: 'active',
    title: 'Active Products',
    priority: 2,
    defaultExpanded: true,
    requiresAuth: true,
    items: [
      { 
        name: 'Fundraising', 
        href: '/dashboard/fundraising', 
        icon: Handshake, 
        description: 'Manage your Bitcoin campaigns',
        badge: 'Live',
        requiresAuth: true
      },
    ]
  },
  {
    id: 'upcoming',
    title: 'Coming Soon',
    priority: 3,
    defaultExpanded: false,
    collapsible: true,
    requiresAuth: true,
    items: [
      { 
        name: 'Organizations', 
        href: '/dashboard/organizations', 
        icon: Building, 
        comingSoon: true,
        description: 'Manage your organizations',
        requiresAuth: true
      },
      { 
        name: 'Projects', 
        href: '/dashboard/projects', 
        icon: Briefcase, 
        comingSoon: true,
        description: 'Track your projects',
        requiresAuth: true
      },
      { 
        name: 'Events', 
        href: '/dashboard/events', 
        icon: Calendar, 
        comingSoon: true,
        description: 'Organize and attend events',
        requiresAuth: true
      },
      { 
        name: 'Assets', 
        href: '/dashboard/assets', 
        icon: Wallet, 
        comingSoon: true,
        description: 'Manage your digital assets',
        requiresAuth: true
      },
      { 
        name: 'Network', 
        href: '/dashboard/people', 
        icon: Users, 
        comingSoon: true,
        description: 'Connect with people',
        requiresAuth: true
      },
    ]
  }
]

// Bottom navigation items for account management
export const bottomNavItems: NavItem[] = [
  { 
    name: 'Edit Profile', 
    href: '/profile', 
    icon: Edit3, 
    description: 'Update your profile information',
    requiresAuth: true
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings, 
    description: 'Account and security settings',
    requiresAuth: true
  },
]

// Navigation analytics events for tracking user behavior
export const navigationEvents = {
  SIDEBAR_TOGGLE: 'navigation_sidebar_toggle',
  SECTION_TOGGLE: 'navigation_section_toggle',
  ITEM_CLICK: 'navigation_item_click',
  COMING_SOON_CLICK: 'navigation_coming_soon_click',
} as const

// Navigation accessibility labels
export const navigationLabels = {
  SIDEBAR_TOGGLE: 'Toggle navigation sidebar',
  SECTION_TOGGLE: 'Toggle navigation section',
  MAIN_NAVIGATION: 'Main navigation',
  BOTTOM_NAVIGATION: 'Account navigation',
  COMING_SOON: 'Feature coming soon',
} as const

// Navigation keyboard shortcuts
export const navigationShortcuts = {
  TOGGLE_SIDEBAR: 'cmd+b',
  GO_TO_DASHBOARD: 'cmd+1',
  GO_TO_PROFILE: 'cmd+2',
  GO_TO_FUNDRAISING: 'cmd+3',
  GO_TO_SETTINGS: 'cmd+,',
} as const 