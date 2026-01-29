import { Briefcase, Users } from 'lucide-react';
import { FeaturePreviewProps } from '@/components/sections/FeaturePreview';

export type PlatformFeature = Omit<FeaturePreviewProps, 'variant' | 'showCTA'> & {
  landingPageHref?: string;
};

export const platformFeatures: PlatformFeature[] = [
  {
    title: 'Projects',
    description: 'Create Bitcoin-powered fundraising projects for any cause',
    icon: Briefcase,
    href: '/projects/create',
    landingPageHref: '/projects/create',
    color: 'bg-gradient-to-r from-bitcoin-orange to-orange-500',
    iconColor: 'text-bitcoin-orange',
    preview:
      'Create project pages, accept Bitcoin funding, track funding progress, and engage with supporters.',
    comingSoon: false,
    priority: 1,
  },
  {
    title: 'People',
    description: 'Connect with supporters and build your community network',
    icon: Users,
    href: '/discover',
    landingPageHref: '/discover',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    iconColor: 'text-purple-600',
    preview:
      'Browse profiles, connect with others, and build meaningful relationships in the Bitcoin community.',
    comingSoon: false,
    priority: 2,
  },
];

// Available features (not coming soon)
export const availableFeatures = platformFeatures.filter(feature => !feature.comingSoon);

// Coming soon features
export const comingSoonFeatures = platformFeatures.filter(feature => feature.comingSoon);

// Get feature by title
export const getFeatureByTitle = (title: string) =>
  platformFeatures.find(feature => feature.title.toLowerCase() === title.toLowerCase());
