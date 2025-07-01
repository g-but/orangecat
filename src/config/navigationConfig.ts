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
  Rocket,
} from 'lucide-react'
import { NavSection, NavItem } from '@/hooks/useNavigation'

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
        requiresAuth: true
      },
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
    id: 'social',
    title: 'Social & Collaboration',
    priority: 2,
    defaultExpanded: true,
    requiresAuth: true,
    items: [
      { 
        name: 'People', 
        href: '/people', 
        icon: Users, 
        description: 'Connect with Bitcoin enthusiasts',
        requiresAuth: true
      },
      { 
        name: 'Organizations', 
        href: '/organizations', 
        icon: Building, 
        description: 'Join or create Bitcoin organizations',
        requiresAuth: true
      },
      { 
        name: 'Projects', 
        href: '/projects', 
        icon: Rocket, 
        description: 'Discover and support Bitcoin projects',
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
  GO_TO_HOME: 'cmd+1',
  GO_TO_FUNDRAISING: 'cmd+2',
  GO_TO_PEOPLE: 'cmd+3',
  GO_TO_ORGANIZATIONS: 'cmd+4',
  GO_TO_PROJECTS: 'cmd+5',
  GO_TO_SETTINGS: 'cmd+,',
} as const 