/**
 * Organization Field Guidance Content
 *
 * Single source of truth for organization creation guidance.
 * Used by GuidancePanel to provide contextual help and examples.
 *
 * Created: 2025-12-06
 * Last Modified: 2025-12-06
 * Last Modified Summary: Initial organization guidance content
 */

import React from 'react';
import {
  Building2,
  Users,
  Globe,
  Bitcoin,
  Settings,
  FileText,
  Link,
  Shield,
  CheckCircle2,
  Target,
} from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export type OrganizationFieldType =
  | 'name'
  | 'slug'
  | 'type'
  | 'description'
  | 'website_url'
  | 'governance_model'
  | 'treasury_address'
  | 'lightning_address'
  | null;

export const organizationGuidanceContent: Record<
  NonNullable<OrganizationFieldType>,
  GuidanceContent
> = {
  name: {
    icon: React.createElement(Building2, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Organization Name',
    description:
      "Choose a clear, memorable name that represents your organization's purpose and values.",
    tips: [
      'Keep it simple and easy to remember',
      'Avoid overly complex or confusing names',
      'Consider your target audience',
      'Check if the name is already in use',
      'Make it relevant to your mission',
    ],
    examples: [
      'Orange Cat Collective',
      'Bitcoin Builders Guild',
      'Zurich Makerspace',
      'Open Source Foundation',
    ],
  },
  slug: {
    icon: React.createElement(Link, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Organization Slug',
    description: 'URL-friendly identifier automatically generated from your organization name.',
    tips: [
      'Auto-generated from organization name',
      "Used in your organization's URL",
      'Keep it short and memorable',
      'Only letters, numbers, and hyphens',
      'Cannot be changed after creation',
    ],
    examples: ['orange-cat-collective', 'bitcoin-builders-guild', 'zurich-makerspace'],
  },
  type: {
    icon: React.createElement(Settings, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Organization Type',
    description:
      "Choose the structure that best fits your organization's legal and operational needs.",
    tips: [
      'Consider your legal requirements',
      'Think about your governance preferences',
      'Choose based on your member structure',
      'Different types have different implications',
      'You can change this later if needed',
    ],
    examples: [
      'Community: Local neighborhood groups',
      'DAO: Protocol governance',
      'Company: Traditional business',
      'Circle: Trust-based communities',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Organization Description',
    description: 'Clearly explain what your organization does, who it serves, and why it exists.',
    tips: [
      'Start with your mission statement',
      'Explain who benefits from your work',
      'Include what makes you unique',
      'Be specific about your activities',
      'Keep it concise but informative',
    ],
    examples: [
      'Building Bitcoin-powered crowdfunding tools for creators and communities worldwide.',
      'Supporting local artisans through fair trade and sustainable practices.',
      'Developing open-source privacy tools for digital rights activists.',
    ],
  },
  website_url: {
    icon: React.createElement(Globe, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Website URL',
    description: "Link to your organization's website for additional information and credibility.",
    tips: [
      'Use your official website if available',
      'Can be added or changed later',
      'Optional but recommended for credibility',
      'Should be professional and relevant',
      'Make sure the link works',
    ],
    examples: [
      'https://orangecat.org',
      'https://bitcoinbuildersguild.com',
      'https://zurichmakerspace.ch',
    ],
  },
  governance_model: {
    icon: React.createElement(Shield, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Governance Model',
    description: 'Define how decisions are made and how power is distributed in your organization.',
    tips: [
      'Hierarchical: Traditional top-down structure',
      'Democratic: Voting-based decisions',
      'Consensus: Everyone must agree',
      'Flat: Equal participation',
      'Choose based on your group dynamics',
    ],
    examples: [
      'Democratic: Most community projects',
      'Consensus: Small, trusted groups',
      'Hierarchical: Established companies',
      'Flat: Highly collaborative teams',
    ],
  },
  treasury_address: {
    icon: React.createElement(Bitcoin, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Bitcoin Treasury Address',
    description:
      "Primary Bitcoin address for your organization's treasury and financial operations.",
    tips: [
      'Use a multi-signature wallet for security',
      'Generate a fresh address for your organization',
      'Consider hardware wallet security',
      'Keep private keys secure and backed up',
      "This will be your organization's main treasury",
    ],
    examples: [
      'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfe2s',
      '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      '3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5',
    ],
  },
  lightning_address: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Lightning Address',
    description: 'Lightning Network address for instant, low-fee Bitcoin payments.',
    tips: [
      'Optional but recommended for modern payments',
      'Format: yourname@domain.com',
      'Enables instant micro-payments',
      'Lower fees than on-chain transactions',
      'Great for donations and small payments',
    ],
    examples: ['orangecat@ln.address', 'guild@lightning.gifts', 'makerspace@zbd.gg'],
  },
};

export const organizationDefaultGuidance: DefaultGuidance = {
  title: 'Why Create an Organization?',
  description:
    'Organizations enable collective action, shared governance, and community building around common goals.',
  features: [
    'Multi-signature treasury for secure Bitcoin management',
    'Democratic governance with voting and proposals',
    'Member management and role assignments',
    'Project affiliation and collective fundraising',
    'Transparent operations and community accountability',
  ],
  benefits: [
    'Pool resources and knowledge for greater impact',
    'Establish credibility through formal structure',
    'Enable large-scale collaborative projects',
    'Create sustainable funding mechanisms',
    'Build lasting communities around shared values',
  ],
};
