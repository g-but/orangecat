/**
 * PEOPLE INITIATIVE MODULE
 * 
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Extracted from main initiatives.ts for modular architecture
 */

import type { Initiative } from '@/types/initiative';

export const people: Initiative = {
  id: 'people',
  name: 'People',
  icon: 'Users',
  color: {
    primary: 'orange-600',
    gradient: 'from-yellow-500 to-orange-500',
    bg: 'orange-100',
    text: 'orange-600',
    border: 'orange-200'
  },
  description: 'Connect with talented individuals for collaboration, mentoring, and building in the Bitcoin ecosystem.',
  longDescription: 'Find skilled developers, designers, marketers, and other professionals. Create meaningful connections, offer mentorship, and build teams for Bitcoin projects.',
  status: 'coming-soon',
  timeline: 'Q3 2026',
  routes: {
    landing: '/people',
    demo: '/demo/people',
    comingSoon: '/coming-soon?feature=people'
  },
  features: [
    {
      icon: 'UserCheck',
      title: 'Profile Creation',
      description: 'Create detailed Bitcoin advocate profiles with skills, experience, and contributions.',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: 'Users',
      title: 'Network Building',
      description: 'Connect with other Bitcoin advocates, builders, and community members worldwide.',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: 'Trophy',
      title: 'Achievement System',
      description: 'Earn recognition for contributions to Bitcoin adoption and community building.',
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      icon: 'MessageCircle',
      title: 'Collaboration Tools',
      description: 'Find collaborators for projects, events, and initiatives in the Bitcoin space.',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: 'Target',
      title: 'Skill Matching',
      description: 'Match skills and expertise with projects and opportunities in the ecosystem.',
      color: 'text-red-600 bg-red-100'
    },
    {
      icon: 'Zap',
      title: 'Lightning Integration',
      description: 'Send tips and payments directly to community members via Lightning Network.',
      color: 'text-orange-600 bg-orange-100'
    }
  ],
  types: [
    { 
      name: 'Developers', 
      icon: 'Code',
      description: 'Bitcoin and Lightning developers',
      example: 'Core contributor',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    { 
      name: 'Educators', 
      icon: 'GraduationCap',
      description: 'Bitcoin educators and content creators',
      example: 'Podcast host',
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    { 
      name: 'Entrepreneurs', 
      icon: 'Briefcase',
      description: 'Bitcoin startup founders and business leaders',
      example: 'Exchange founder',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    { 
      name: 'Advocates', 
      icon: 'Megaphone',
      description: 'Bitcoin adoption advocates and activists',
      example: 'Policy advocate',
      color: 'bg-pink-100 text-pink-700 border-pink-200'
    },
    { 
      name: 'Researchers', 
      icon: 'Search',
      description: 'Bitcoin researchers and analysts',
      example: 'Academic researcher',
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    { 
      name: 'Miners', 
      icon: 'Cpu',
      description: 'Bitcoin miners and mining pool operators',
      example: 'Mining pool operator',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    }
  ],
  capabilities: [
    'Profile management',
    'Skill and expertise tracking',
    'Network building',
    'Collaboration matching',
    'Achievement tracking',
    'Lightning payments',
    'Reputation system',
    'Project contributions',
    'Event participation',
    'Mentorship connections'
  ],
  useCases: [
    'Find Bitcoin developers for projects',
    'Connect with local Bitcoin advocates',
    'Discover educational content creators',
    'Network with Bitcoin entrepreneurs'
  ],
  marketTools: [
    {
      name: 'LinkedIn',
      description: 'Professional networking platform',
      url: 'https://linkedin.com',
      icon: 'Users',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'GitHub',
      description: 'Developer collaboration platform',
      url: 'https://github.com',
      icon: 'Code',
      color: 'bg-gray-100 text-gray-600'
    },
    {
      name: 'Twitter',
      description: 'Social networking and Bitcoin discussion',
      url: 'https://twitter.com',
      icon: 'MessageCircle',
      color: 'bg-orange-100 text-orange-600'
    }
  ]
}; 