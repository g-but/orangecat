import {
  Building,
  Briefcase,
  Calendar,
  Handshake,
  Wallet,
  Users,
} from 'lucide-react'
import { FeaturePreviewProps } from '@/components/sections/FeaturePreview'

export type PlatformFeature = Omit<FeaturePreviewProps, 'variant' | 'showCTA'> & {
  landingPageHref?: string
}

export const platformFeatures: PlatformFeature[] = [
  {
    title: 'Organizations',
    description: 'Create and manage organizations with governance, assets, and members',
    icon: Building,
    href: '/coming-soon?feature=organizations',
    landingPageHref: '/about#organizations',
    color: 'bg-gradient-to-r from-green-500 to-emerald-500',
    iconColor: 'text-green-600',
    preview: 'Set up organizational structures, manage member permissions, and coordinate collective activities.',
    comingSoon: true,
    priority: 1
  },
  {
    title: 'Projects',
    description: 'Launch and manage projects with transparent funding and milestone tracking',
    icon: Briefcase,
    href: '/coming-soon?feature=projects',
    landingPageHref: '/about#projects',
    color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    iconColor: 'text-indigo-600',
    preview: 'Create project proposals, track progress with milestones, and manage collaborative work.',
    comingSoon: true,
    priority: 2
  },
  {
    title: 'Events',
    description: 'Organize and fundraise for conferences, parties, and community gatherings',
    icon: Calendar,
    href: '/coming-soon?feature=events',
    landingPageHref: '/about#events',
    color: 'bg-gradient-to-r from-blue-500 to-teal-500',
    iconColor: 'text-blue-600',
    preview: 'Plan events, sell tickets with Bitcoin, and manage attendee communications.',
    comingSoon: true,
    priority: 3
  },
  {
    title: 'Fundraising Pages',
    description: 'Create powerful fundraising campaigns with Bitcoin for any cause',
    icon: Handshake,
    href: '/fund-yourself',
    landingPageHref: '/fund-yourself',
    color: 'bg-gradient-to-r from-teal-500 to-cyan-500',
    iconColor: 'text-teal-600',
    preview: 'Advanced campaign tools, goal tracking, and supporter engagement features.',
    comingSoon: false,
    priority: 4
  },
  {
    title: 'Assets',
    description: 'List, rent, and discover physical assets in your community',
    icon: Wallet,
    href: '/coming-soon?feature=assets',
    landingPageHref: '/about#assets',
    color: 'bg-gradient-to-r from-orange-500 to-red-500',
    iconColor: 'text-orange-600',
    preview: 'Create an asset marketplace, earn from unused items, and build a sharing economy.',
    comingSoon: true,
    priority: 5
  },
  {
    title: 'People',
    description: 'Connect with friends, create circles, and build your Bitcoin community',
    icon: Users,
    href: '/discover',
    landingPageHref: '/discover',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    iconColor: 'text-purple-600',
    preview: 'Build networks, create interest groups, and facilitate meaningful connections.',
    comingSoon: false,
    priority: 6
  }
]

// Available features (not coming soon)
export const availableFeatures = platformFeatures.filter(feature => !feature.comingSoon)

// Coming soon features
export const comingSoonFeatures = platformFeatures.filter(feature => feature.comingSoon)

// Get feature by title
export const getFeatureByTitle = (title: string) => 
  platformFeatures.find(feature => feature.title.toLowerCase() === title.toLowerCase()) 