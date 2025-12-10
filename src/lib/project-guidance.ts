/**
 * Project Field Guidance Content
 *
 * Single source of truth for project editing guidance.
 * Used by DynamicSidebar to provide contextual help.
 *
 * Created: 2025-11-24
 * Last Modified: 2025-11-24
 * Last Modified Summary: Extracted from DynamicSidebar for reusability
 */

import React from 'react';
import {
  Target,
  FileText,
  DollarSign,
  Coins,
  Lightbulb,
  Wallet,
  Tag,
  ExternalLink,
  Heart,
  Shield,
  Users,
} from 'lucide-react';

export type ProjectFieldType =
  | 'title'
  | 'description'
  | 'goalAmount'
  | 'currency'
  | 'fundingPurpose'
  | 'bitcoinAddress'
  | 'websiteUrl'
  | 'categories'
  | null;

export interface FieldGuidanceContent {
  icon: React.ReactNode;
  title: string;
  description: string;
  tips: string[];
  examples?: string[];
}

export interface DefaultContent {
  title: string;
  description: string;
  features: Array<{
    icon: React.ReactNode;
    text: string;
  }>;
  hint?: string;
}

export const projectGuidanceContent: Record<NonNullable<ProjectFieldType>, FieldGuidanceContent> = {
  title: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Project Title',
    description:
      'Your title is the first thing people see. Make it clear, specific, and inspiring.',
    tips: [
      'Keep it under 60 characters',
      'Be specific: "Community Garden in Basel" > "Garden Project"',
      'Avoid jargon',
      'Make it memorable',
    ],
    examples: ['Community Garden Project', 'Local Animal Shelter', 'Open Source Bitcoin Tools'],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Project Description',
    description: 'Tell your story. What problem are you solving? Why does it matter?',
    tips: [
      'Start with the problem',
      'Explain your solution',
      'Share why this matters',
      'Be authentic and personal',
    ],
  },
  goalAmount: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Goal Amount',
    description: 'Set a funding target. Optional but helps donors understand your needs.',
    tips: ['Be realistic and specific', 'Break down major costs', 'Can be updated later'],
  },
  currency: {
    icon: React.createElement(Coins, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Display Currency',
    description: 'Choose how to display your goal. All donations are received in Bitcoin.',
    tips: [
      '⚠️ This is DISPLAY ONLY',
      'All donations settle to your Bitcoin wallet',
      'CHF/USD/EUR help local donors',
      'SATS is native Bitcoin',
    ],
  },
  fundingPurpose: {
    icon: React.createElement(Lightbulb, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Funding Purpose',
    description: 'What will donations be used for? Transparency builds trust.',
    tips: ['Be specific about expenses', 'Use bullet points', 'Update as needs evolve'],
  },
  bitcoinAddress: {
    icon: React.createElement(Wallet, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Bitcoin Address',
    description: 'Where donations will be sent. Can add later, but needed to receive funds.',
    tips: [
      'Use a wallet YOU control',
      'Starts with bc1, 1, or 3',
      'Lightning looks like email@domain.com',
      "⚠️ Don't have a wallet? Get one first!",
    ],
  },
  websiteUrl: {
    icon: React.createElement(ExternalLink, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Project Website',
    description: 'Link to your project website or social media page. Helps build credibility.',
    tips: [
      'Must be a valid HTTP or HTTPS URL',
      'Can link to website, Twitter, GitHub, etc.',
      'Increases trust and transparency',
      'Optional but recommended',
    ],
    examples: [
      'https://yourproject.com',
      'https://twitter.com/yourproject',
      'https://github.com/yourproject',
    ],
  },
  categories: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Categories',
    description: 'Help people discover your project.',
    tips: [
      'Choose 1-3 most relevant',
      'Improves discoverability',
      'First is your primary category',
    ],
  },
};

export const projectDefaultContent: DefaultContent = {
  title: "What's a Project?",
  description:
    'A project is any initiative that needs funding — from personal goals to community causes. Accept Bitcoin donations directly to your wallet.',
  features: [
    {
      icon: React.createElement(Heart, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Accept Bitcoin donations instantly',
    },
    {
      icon: React.createElement(Users, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Rally supporters and share updates',
    },
    {
      icon: React.createElement(Shield, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Transparent and self-custodial by design',
    },
  ],
  hint: '💡 Click on any field to get specific guidance',
};




























