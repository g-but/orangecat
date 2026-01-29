/**
 * Project Field Guidance Content
 *
 * Single source of truth for project creation guidance.
 * Used by GuidancePanel to provide contextual help and examples.
 *
 * Created: 2025-12-06
 * Last Modified: 2025-12-06
 * Last Modified Summary: Initial project guidance content for EntityForm
 */

import React from 'react';
import {
  Rocket,
  FileText,
  Target,
  DollarSign,
  Bitcoin,
  Coins,
  ExternalLink,
  Tag,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export type ProjectFieldType =
  | 'title'
  | 'description'
  | 'goal_amount'
  | 'goalAmount'
  | 'currency'
  | 'funding_purpose'
  | 'fundingPurpose'
  | 'bitcoin_address'
  | 'bitcoinAddress'
  | 'lightning_address'
  | 'website_url'
  | 'category'
  | 'categories'
  | 'tags'
  | 'start_date'
  | 'target_completion'
  | null;

export const projectGuidanceContent: Record<NonNullable<ProjectFieldType>, GuidanceContent> = {
  title: {
    icon: React.createElement(Rocket, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Project Title',
    description:
      "Choose a compelling title that clearly communicates what you're building and why it matters.",
    tips: [
      'Be specific and descriptive',
      'Include the main outcome or benefit',
      'Keep it under 60 characters',
      'Use action words that inspire',
      'Avoid jargon or acronyms',
    ],
    examples: [
      'Build a Community Solar Garden',
      'Open-Source Bitcoin Privacy Tools',
      'Sustainable Urban Farming Initiative',
      'Decentralized Artist Collaboration Platform',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Project Description',
    description:
      'Tell the complete story of your project. Explain the problem, your solution, and the impact.',
    tips: [
      "Start with the problem you're solving",
      'Explain your unique approach',
      'Include specific outcomes and benefits',
      'Mention your background and expertise',
      'End with a clear call to action',
    ],
    examples: [
      'Our community solar garden will provide clean energy while teaching sustainable practices...',
      "We're building privacy tools that anyone can use to protect their financial sovereignty...",
    ],
  },
  goal_amount: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Funding Goal',
    description:
      'Set a realistic funding target that covers your project costs and gives backers confidence.',
    tips: [
      'Calculate actual costs first',
      'Include a small buffer for unexpected expenses',
      'Consider what amount shows serious commitment',
      'Think about what success looks like',
      'Some projects work better without fixed goals',
    ],
    examples: [
      '5000 CHF for initial prototype development',
      '25000 USD for community center construction',
      'No fixed goal - ongoing development funding',
    ],
  },
  currency: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Currency Selection',
    description: 'Choose the currency that best fits your project and target audience.',
    tips: [
      'BTC/SATS for Bitcoin-native projects',
      'CHF/USD/EUR for traditional funding',
      "Consider your supporters' preferences",
      'Think about currency volatility',
      'All payments convert to Bitcoin',
    ],
    examples: [
      'SATS for micro-funding and Bitcoin community',
      'CHF for Swiss-based local projects',
      'USD for international reach',
    ],
  },
  funding_purpose: {
    icon: React.createElement(Coins, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Funding Purpose',
    description: 'Clearly explain how funding will be used and what specific outcomes it enables.',
    tips: [
      'Break down costs into categories',
      'Be transparent about allocation',
      'Explain why each expense is necessary',
      'Include both direct and indirect benefits',
      'Update backers on actual spending',
    ],
    examples: [
      '60% hardware and materials, 30% labor, 10% community outreach',
      '100% goes directly to software development and server costs',
      'Funds support full-time development for 6 months',
    ],
  },
  bitcoin_address: {
    icon: React.createElement(Bitcoin, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Bitcoin Address',
    description: 'Your secure Bitcoin address where funding will be received.',
    tips: [
      'Use a fresh address for this project',
      'Consider using a multi-signature wallet',
      'Keep private keys secure and backed up',
      'Use a hardware wallet for large amounts',
      'Consider privacy implications',
    ],
    examples: [
      'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfe2s',
      'Multi-signature wallet with 3-of-5 structure',
      'Hardware wallet address for security',
    ],
  },
  lightning_address: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Lightning Address',
    description: 'Lightning Network address for instant, low-fee Bitcoin payments.',
    tips: [
      'Format: yourproject@domain.com',
      'Enables instant micro-funding',
      'Lower fees than on-chain transactions',
      'Great for international funding',
      'Works alongside regular Bitcoin address',
    ],
    examples: [
      'solarproject@orangecat.org',
      'privacytools@lightning.gifts',
      'communitygarden@zbd.gg',
    ],
  },
  website_url: {
    icon: React.createElement(ExternalLink, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Project Website',
    description: 'Link to additional information about your project.',
    tips: [
      "Use your project's official website",
      'Can be a landing page or detailed site',
      'Should be professional and informative',
      'Include contact information',
      'Keep it updated during the project',
    ],
    examples: [
      'https://solarcommunity.org',
      'https://github.com/your-org/privacy-tools',
      'https://communitygarden.ch',
    ],
  },
  category: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Project Category',
    description: "Choose the category that best describes your project's focus area.",
    tips: [
      'Pick the most specific category available',
      'Think about how people search for projects',
      "Consider your project's primary impact area",
      'Categories help with discoverability',
      'You can change this later if needed',
    ],
    examples: [
      'Environment & Sustainability',
      'Technology & Innovation',
      'Community & Culture',
      'Education & Learning',
    ],
  },
  tags: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Project Tags',
    description: 'Add relevant tags to help people discover your project through search.',
    tips: [
      'Use specific, searchable terms',
      'Include location if relevant',
      'Add technology or method keywords',
      'Think about what people would search for',
      "Don't over-tag - quality over quantity",
    ],
    examples: [
      'solar, renewable, community, education',
      'bitcoin, privacy, open-source, tools',
      'gardening, urban, sustainable, local',
    ],
  },
  start_date: {
    icon: React.createElement(Calendar, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Start Date',
    description: 'When do you plan to begin active work on this project?',
    tips: [
      'Be realistic about your timeline',
      'Consider dependencies and preparation time',
      'Communicate changes if dates shift',
      'Some projects start immediately',
      'Others need planning or funding first',
    ],
    examples: [
      'Immediate - starting as soon as funding is secured',
      'March 2025 - after community consultation period',
      'Ongoing - this is a continuous initiative',
    ],
  },
  target_completion: {
    icon: React.createElement(CheckCircle2, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Target Completion',
    description: 'When do you expect to complete the main deliverables of your project?',
    tips: [
      'Set realistic completion targets',
      'Break large projects into milestones',
      'Consider dependencies and external factors',
      'Communicate progress regularly',
      'Be transparent if timelines change',
    ],
    examples: [
      '6 months from funding completion',
      'December 2025 - full system launch',
      'Ongoing - continuous community support',
    ],
  },
  // CamelCase aliases for backward compatibility
  goalAmount: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Funding Goal',
    description:
      'Set a realistic funding target that covers your project costs and gives backers confidence.',
    tips: [
      'Calculate actual costs first',
      'Include a small buffer for unexpected expenses',
      'Consider what amount shows serious commitment',
      'Think about what success looks like',
      'Some projects work better without fixed goals',
    ],
    examples: [
      '5000 CHF for initial prototype development',
      '25000 USD for community center construction',
      'No fixed goal - ongoing development funding',
    ],
  },
  fundingPurpose: {
    icon: React.createElement(Coins, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Funding Purpose',
    description: 'Clearly explain how funding will be used and what specific outcomes it enables.',
    tips: [
      'Break down costs into categories',
      'Be transparent about allocation',
      'Explain why each expense is necessary',
      'Include both direct and indirect benefits',
      'Update backers on actual spending',
    ],
    examples: [
      '60% hardware and materials, 30% labor, 10% community outreach',
      '100% goes directly to software development and server costs',
      'Funds support full-time development for 6 months',
    ],
  },
  bitcoinAddress: {
    icon: React.createElement(Bitcoin, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Bitcoin Address',
    description: 'Your secure Bitcoin address where funding will be received.',
    tips: [
      'Use a fresh address for this project',
      'Consider using a multi-signature wallet',
      'Keep private keys secure and backed up',
      'Use a hardware wallet for large amounts',
      'Consider privacy implications',
    ],
    examples: [
      'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfe2s',
      'Multi-signature wallet with 3-of-5 structure',
      'Hardware wallet address for security',
    ],
  },
  categories: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Project Categories',
    description: "Choose the categories that best describe your project's focus areas.",
    tips: [
      'Pick the most specific categories available',
      'Think about how people search for projects',
      "Consider your project's primary impact areas",
      'Categories help with discoverability',
      'You can change this later if needed',
    ],
    examples: [
      'Environment & Sustainability',
      'Technology & Innovation',
      'Community & Culture',
      'Education & Learning',
    ],
  },
};

export const projectDefaultGuidance: DefaultGuidance = {
  title: 'Create a Compelling Project',
  description:
    'Transform your idea into a funded reality. Projects on OrangeCat combine crowdfunding with Bitcoin payments for transparent, community-driven development.',
  features: [
    {
      icon: React.createElement(Target, { className: 'w-4 h-4 text-tiffany-600' }),
      text: 'Set clear funding goals with Bitcoin payments',
    },
    {
      icon: React.createElement(ExternalLink, { className: 'w-4 h-4 text-tiffany-600' }),
      text: 'Reach global supporters through our network',
    },
    {
      icon: React.createElement(CheckCircle2, { className: 'w-4 h-4 text-tiffany-600' }),
      text: 'Maintain full control and transparency',
    },
    {
      icon: React.createElement(Rocket, { className: 'w-4 h-4 text-tiffany-600' }),
      text: 'Build community around your vision',
    },
    {
      icon: React.createElement(DollarSign, { className: 'w-4 h-4 text-tiffany-600' }),
      text: 'Access ongoing funding and support',
    },
  ],
};
