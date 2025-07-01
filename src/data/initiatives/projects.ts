/**
 * PROJECTS INITIATIVE MODULE
 * 
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Extracted from main initiatives.ts for modular architecture
 */

import type { Initiative } from '@/types/initiative';

export const projects: Initiative = {
  id: 'projects',
  name: 'Projects',
  icon: 'Briefcase',
  color: {
    primary: 'purple-600',
    gradient: 'from-indigo-500 to-purple-500',
    bg: 'purple-100',
    text: 'purple-600',
    border: 'purple-200'
  },
  description: 'Launch and manage projects with transparent funding, milestone tracking, and collaborative tools powered by Bitcoin escrow.',
  longDescription: 'Create project proposals, track progress with milestones, manage collaborative work, and ensure transparent funding with Bitcoin escrow and automatic milestone releases.',
  status: 'coming-soon',
  timeline: 'Q1 2026',
  routes: {
    landing: '/projects',
    demo: '/demo/projects',
    comingSoon: '/coming-soon?feature=projects'
  },
  features: [
    {
      icon: 'Code',
      title: 'Project Creation',
      description: 'Start projects with clear goals, timelines, and Bitcoin-based funding mechanisms.',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: 'Users',
      title: 'Team Collaboration',
      description: 'Invite collaborators, assign roles, and coordinate work with transparent contribution tracking.',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: 'Target',
      title: 'Milestone Tracking',
      description: 'Set clear milestones with automatic Bitcoin escrow releases upon completion.',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: 'Shield',
      title: 'Bitcoin Escrow',
      description: 'Secure project funding with smart contracts and milestone-based releases.',
      color: 'text-orange-600 bg-orange-100'
    },
    {
      icon: 'BarChart3',
      title: 'Progress Analytics',
      description: 'Track project progress, team performance, and funding utilization in real-time.',
      color: 'text-red-600 bg-red-100'
    },
    {
      icon: 'Globe',
      title: 'Open Source Integration',
      description: 'Seamless integration with GitHub, GitLab, and other open source platforms.',
      color: 'text-yellow-600 bg-yellow-100'
    }
  ],
  types: [
    { 
      name: 'Open Source', 
      icon: 'Code',
      description: 'Open source software projects',
      example: 'Bitcoin development tools',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    { 
      name: 'Research Projects', 
      icon: 'Search',
      description: 'Academic and technical research',
      example: 'Lightning Network research',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    { 
      name: 'Creative Works', 
      icon: 'Palette',
      description: 'Art, design, and creative projects',
      example: 'Bitcoin documentary',
      color: 'bg-pink-100 text-pink-700 border-pink-200'
    },
    { 
      name: 'Community Projects', 
      icon: 'Users',
      description: 'Community-driven initiatives',
      example: 'Local Bitcoin adoption',
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    { 
      name: 'Infrastructure', 
      icon: 'Network',
      description: 'Technical infrastructure projects',
      example: 'Lightning node network',
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    { 
      name: 'Educational', 
      icon: 'GraduationCap',
      description: 'Educational content and courses',
      example: 'Bitcoin development course',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    }
  ],
  capabilities: [
    'Project management and tracking',
    'Milestone-based funding',
    'Team collaboration tools',
    'Bitcoin escrow services',
    'Progress analytics',
    'Code repository integration',
    'Automated payments',
    'Quality assurance',
    'Documentation management',
    'Community engagement'
  ],
  useCases: [
    'Open source development projects',
    'Research and academic studies',
    'Creative and artistic works',
    'Community-driven initiatives'
  ],
  marketTools: [
    {
      name: 'GitHub',
      description: 'Code collaboration platform',
      url: 'https://github.com',
      icon: 'Code',
      color: 'bg-gray-100 text-gray-600'
    },
    {
      name: 'GitLab',
      description: 'DevOps lifecycle platform',
      url: 'https://gitlab.com',
      icon: 'GitBranch',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      name: 'Trello',
      description: 'Project management boards',
      url: 'https://trello.com',
      icon: 'Target',
      color: 'bg-blue-100 text-blue-600'
    }
  ]
}; 