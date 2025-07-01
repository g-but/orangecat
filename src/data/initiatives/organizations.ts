/**
 * ORGANIZATIONS INITIATIVE MODULE
 * 
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Refactored to export individual initiative for modular architecture
 */

import type { Initiative } from '@/types/initiative';

export const organizations: Initiative = {
    id: 'organizations',
    name: 'Organizations',
    icon: 'Building',
    color: {
      primary: 'green-600',
      gradient: 'from-green-500 to-emerald-500',
      bg: 'green-100',
      text: 'green-600',
      border: 'green-200'
    },
    description: 'Create and manage modern organizations with governance tools, asset management, and member coordination features powered by Bitcoin.',
    longDescription: 'Build structured organizations with clear governance, manage collective assets, coordinate member activities, and make decisions together using Bitcoin-powered voting mechanisms.',
    status: 'coming-soon',
    timeline: 'Q1 2026',
    routes: {
      landing: '/organizations',
      demo: '/demo/organizations',
      comingSoon: '/coming-soon?feature=organizations'
    },
    features: [
      {
        icon: 'Vote',
        title: 'Governance Tools',
        description: 'Implement democratic decision-making with voting mechanisms and proposal systems.',
        color: 'text-blue-600 bg-blue-100'
      },
      {
        icon: 'Coins',
        title: 'Asset Management',
        description: 'Manage organizational Bitcoin holdings with multi-signature security and transparency.',
        color: 'text-yellow-600 bg-yellow-100'
      },
      {
        icon: 'Users',
        title: 'Member Coordination',
        description: 'Organize team members, assign roles, and coordinate activities seamlessly.',
        color: 'text-purple-600 bg-purple-100'
      },
      {
        icon: 'FileText',
        title: 'Proposal System',
        description: 'Create, discuss, and vote on organizational proposals with transparent processes.',
        color: 'text-green-600 bg-green-100'
      },
      {
        icon: 'BarChart3',
        title: 'Analytics & Reporting',
        description: 'Track organizational performance, member engagement, and financial metrics.',
        color: 'text-red-600 bg-red-100'
      },
      {
        icon: 'Shield',
        title: 'Security & Compliance',
        description: 'Enterprise-grade security with audit trails and compliance monitoring.',
        color: 'text-teal-600 bg-teal-100'
      }
    ],
    types: [
      { 
        name: 'Tech Company', 
        icon: 'Briefcase',
        description: 'Technology businesses and startups',
        example: 'Software development company',
        color: 'bg-bitcoinOrange text-bitcoinOrange border-bitcoinOrange'
      },
      { 
        name: 'DAO', 
        icon: 'Vote',
        description: 'Decentralized autonomous organizations',
        example: 'Community development fund',
        color: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      { 
        name: 'Non-Profit', 
        icon: 'Award',
        description: 'Advocacy and education organizations',
        example: 'Educational foundation',
        color: 'bg-green-100 text-green-700 border-green-200'
      },
      { 
        name: 'Investment Group', 
        icon: 'BarChart3',
        description: 'Collective investment and funding groups',
        example: 'Community venture fund',
        color: 'bg-purple-100 text-purple-700 border-purple-200'
      },
      { 
        name: 'Community Organization', 
        icon: 'Users',
        description: 'Local meetups and communities',
        example: 'Local tech meetup group',
        color: 'bg-teal-100 text-teal-700 border-teal-200'
      },
      { 
        name: 'Cooperative', 
        icon: 'Network',
        description: 'Member-owned cooperatives',
        example: 'Worker cooperative',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
      }
    ],
    capabilities: [
      'Democratic governance and voting',
      'Multi-signature asset management',
      'Member role and permission management',
      'Proposal creation and discussion',
      'Financial transparency and reporting',
      'Automated compliance monitoring',
      'Meeting and decision tracking',
      'Member onboarding and verification',
      'Integration with external tools',
      'Audit trail and history'
    ],
    useCases: [
      'DAOs and Bitcoin collectives',
      'Community organizations',
      'Investment clubs',
      'Cooperative businesses'
    ],
    marketTools: [
      {
        name: 'Monday.com',
        description: 'Work management platform',
        url: 'https://monday.com',
        icon: 'Briefcase',
        color: 'bg-red-100 text-red-600'
      },
      {
        name: 'Notion',
        description: 'Team workspace and documentation',
        url: 'https://notion.so',
        icon: 'FileText',
        color: 'bg-teal-100 text-teal-600'
      },
      {
        name: 'Slack',
        description: 'Team communication platform',
        url: 'https://slack.com',
        icon: 'MessageSquare',
        color: 'bg-purple-100 text-purple-600'
      }
    ]
}; 