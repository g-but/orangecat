/**
 * ORGANIZATIONS INITIATIVE MODULE
 *
 * Created: 2025-12-05
 * Last Modified: 2025-12-05
 * Last Modified Summary: Created comprehensive organizations initiative for collective action and governance
 */

import type { Initiative } from '@/types/initiative';

export const organizations: Initiative = {
  id: 'organizations',
  name: 'Organizations',
  icon: 'Building',
  color: {
    primary: 'emerald-600',
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'emerald-100',
    text: 'emerald-600',
    border: 'emerald-200',
  },
  description:
    'Create and manage Bitcoin-powered organizations with governance, treasury management, and collective decision-making.',
  longDescription:
    'Build decentralized autonomous organizations (DAOs) with transparent governance, multi-signature treasuries, and democratic decision-making. Enable collective action for projects, assets, and community initiatives.',
  status: 'coming-soon',
  timeline: 'Q1 2026',
  routes: {
    landing: '/organizations',
    demo: '/demo/organizations',
    comingSoon: '/coming-soon?feature=organizations',
  },
  features: [
    {
      icon: 'Users',
      title: 'Member Management',
      description: 'Invite members with customizable roles, permissions, and voting rights',
      color: 'text-blue-600 bg-blue-100',
    },
    {
      icon: 'Vote',
      title: 'Governance System',
      description: 'Create proposals, conduct votes, and implement democratic decision-making',
      color: 'text-purple-600 bg-purple-100',
    },
    {
      icon: 'Wallet',
      title: 'Multi-Sig Treasury',
      description: 'Secure organizational funds with multi-signature wallets and spending limits',
      color: 'text-orange-600 bg-orange-100',
    },
    {
      icon: 'Link',
      title: 'Project Affiliation',
      description: 'Associate organizations with projects, assets, and community initiatives',
      color: 'text-green-600 bg-green-100',
    },
    {
      icon: 'Shield',
      title: 'Legal Framework',
      description: 'Built-in legal templates and compliance tools for organizational structures',
      color: 'text-red-600 bg-red-100',
    },
    {
      icon: 'BarChart3',
      title: 'Performance Analytics',
      description: 'Track organizational health, member engagement, and decision outcomes',
      color: 'text-cyan-600 bg-cyan-100',
    },
  ],
  types: [
    {
      name: 'Decentralized Autonomous Organizations (DAOs)',
      icon: 'Network',
      description: 'Fully decentralized organizations with on-chain governance',
      example: 'Bitcoin Development DAO',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    {
      name: 'Community Cooperatives',
      icon: 'Users',
      description: 'Member-owned cooperatives for community projects',
      example: 'Local Bitcoin Meetup Cooperative',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    {
      name: 'Business Collectives',
      icon: 'Briefcase',
      description: 'Collaborative business entities and worker-owned companies',
      example: 'Open Source Software Collective',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
    {
      name: 'Investment Clubs',
      icon: 'TrendingUp',
      description: 'Collective investment and asset management groups',
      example: 'Bitcoin Investment Syndicate',
      color: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    {
      name: 'Non-Profit Organizations',
      icon: 'Heart',
      description: 'Charitable and non-profit entities with transparent governance',
      example: 'Bitcoin Education Foundation',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
    {
      name: 'Research Consortia',
      icon: 'Search',
      description: 'Collaborative research and development organizations',
      example: 'Lightning Network Research Group',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
  ],
  capabilities: [
    'Multi-signature treasury management',
    'Proposal creation and voting systems',
    'Member role and permission management',
    'On-chain governance and decision-making',
    'Project and asset affiliation',
    'Legal entity formation support',
    'Transparent financial reporting',
    'Community engagement tools',
    'Automated compliance monitoring',
    'Integration with existing legal frameworks',
  ],
  useCases: [
    'Form decentralized autonomous organizations (DAOs)',
    'Create community cooperatives and collectives',
    'Build worker-owned businesses',
    'Manage investment clubs and syndicates',
    'Establish non-profit foundations',
    'Coordinate research consortia',
  ],
  marketTools: [
    {
      name: 'Aragon',
      description: 'DAO creation and governance platform',
      url: 'https://aragon.org',
      icon: 'Network',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      name: 'Snapshot',
      description: 'Off-chain voting for DAOs',
      url: 'https://snapshot.org',
      icon: 'Vote',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      name: 'Colony',
      description: 'Organizational management platform',
      url: 'https://colony.io',
      icon: 'Building',
      color: 'bg-green-100 text-green-600',
    },
  ],
};



