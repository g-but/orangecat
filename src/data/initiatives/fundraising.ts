/**
 * FUNDRAISING INITIATIVE MODULE
 * 
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Extracted from main initiatives.ts for modular architecture
 */

import type { Initiative } from '@/types/initiative';

export const fundraising: Initiative = {
  id: 'fundraising',
  name: 'Fundraising',
  icon: 'Target',
  color: {
    primary: 'red-600',
    gradient: 'from-red-500 to-pink-500',
    bg: 'red-100',
    text: 'red-600',
    border: 'red-200'
  },
  description: 'Launch fundraising projects for causes, startups, and creative projects with Bitcoin-powered transparency.',
  longDescription: 'Create compelling projects, accept Bitcoin donations, track progress transparently, and build trust with your supporters through immutable donation records.',
  status: 'available',
  timeline: 'Available Now',
  routes: {
    landing: '/fundraising',
    demo: '/demo/fundraising',
    comingSoon: '/fundraising'
  },
  features: [
    {
      icon: 'Target',
      title: 'Campaign Creation',
      description: 'Create compelling fundraising projects with rich media and transparent goals.',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: 'Wallet',
      title: 'Bitcoin Donations',
      description: 'Accept Bitcoin and Lightning donations with automatic conversion options.',
      color: 'text-orange-600 bg-orange-100'
    },
    {
      icon: 'BarChart',
      title: 'Progress Tracking',
      description: 'Real-time progress tracking with transparent donation records on the blockchain.',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: 'Shield',
      title: 'Trust & Transparency',
      description: 'All donations are recorded immutably, ensuring complete transparency for supporters.',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: 'Users',
      title: 'Social Sharing',
      description: 'Built-in social sharing tools to amplify your project reach and engagement.',
      color: 'text-pink-600 bg-pink-100'
    },
    {
      icon: 'Bell',
      title: 'Smart Notifications',
      description: 'Automated updates to supporters about project milestones and progress.',
      color: 'text-yellow-600 bg-yellow-100'
    }
  ],
  types: [
    { 
      name: 'Charity Fundraising', 
      icon: 'Heart',
      description: 'Non-profit and charitable causes',
      example: 'Disaster relief fund',
      color: 'bg-red-100 text-red-700 border-red-200'
    },
    { 
      name: 'Startup Fundraising', 
      icon: 'Rocket',
      description: 'Business and startup capital',
      example: 'Bitcoin startup seed round',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    { 
      name: 'Creative Projects', 
      icon: 'Palette',
      description: 'Art, music, and creative endeavors',
      example: 'Independent film project',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    { 
      name: 'Community Initiatives', 
      icon: 'Users',
      description: 'Local community projects',
      example: 'Bitcoin meetup funding',
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    { 
      name: 'Educational Projects', 
      icon: 'GraduationCap',
      description: 'Education and awareness projects',
      example: 'Bitcoin education program',
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    { 
      name: 'Emergency Relief', 
      icon: 'AlertTriangle',
      description: 'Crisis response and emergency aid',
      example: 'Natural disaster relief',
      color: 'bg-pink-100 text-pink-700 border-pink-200'
    }
  ],
  capabilities: [
    'Campaign management',
    'Bitcoin payment processing',
    'Goal tracking and milestones',
    'Donor communication',
    'Social media integration',
    'Transparent fund allocation',
    'Multi-currency support',
    'Automated refunds',
    'Tax receipt generation',
    'Campaign analytics'
  ],
  useCases: [
    'Raise funds for charitable causes',
    'Launch startup funding projects',
    'Support creative and artistic projects',
    'Fund community development initiatives'
  ],
  marketTools: [
    {
      name: 'GoFundMe',
      description: 'Popular crowdfunding platform',
      url: 'https://gofundme.com',
      icon: 'Heart',
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Kickstarter',
      description: 'Creative project funding',
      url: 'https://kickstarter.com',
      icon: 'Rocket',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Indiegogo',
      description: 'Flexible funding projects',
      url: 'https://indiegogo.com',
      icon: 'Target',
      color: 'bg-pink-100 text-pink-600'
    }
  ]
}; 