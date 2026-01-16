import { User } from '@supabase/supabase-js'
import { LucideIcon } from 'lucide-react'

export type DashboardCard = {
  title: string
  subtitle: string
  description: string
  action: {
    label: string
    href: string
    variant?: 'primary' | 'secondary' | 'outline'
  }
}

export type DashboardState = {
  user: User | null
  loading: boolean
  error: string | null
}

// Common types for authenticated dashboard pages
export interface DashboardStats {
  icon: LucideIcon
  iconColor: string
  label: string
  value: string | number
  subtitle: string
}

export interface DashboardItem {
  id: number
  title: string
  type: string
  status: string
  role: string
  color: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any // Allow additional properties for specific item types
}

export interface DashboardActivity {
  type: string
  title: string
  context: string // organization, event, project name
  time: string
  icon: LucideIcon
}

export interface FeatureBanner {
  icon: LucideIcon
  iconColor: string
  title: string
  description: string
  timeline: string
  ctaLabel: string
  ctaHref: string
  ctaVariant?: 'primary' | 'secondary' | 'outline'
  gradientColors: string
}

export interface DashboardConfig {
  title: string
  subtitle: string
  featureBanner?: FeatureBanner // Optional for functional dashboards
  stats?: DashboardStats[] // Optional since we generate them dynamically
  itemsTitle: string
  activityTitle: string
  createButtonLabel: string
  createButtonHref: string
  backButtonHref: string
  featureName?: string
  timeline?: string
  learnMoreUrl?: string
}

// Demo data interfaces
export interface OrganizationData extends DashboardItem {
  members: number
  treasury: number
  proposals: number
}

export interface EventData extends DashboardItem {
  date: string
  time: string
  location: string
  attendees: number
  capacity: number
  revenue: number
}

export interface ProjectData extends DashboardItem {
  progress: number
  contributors: number
  funding: number
  deadline: string
} 