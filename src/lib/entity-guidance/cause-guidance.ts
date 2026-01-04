/**
 * Cause Field Guidance Content
 *
 * Single source of truth for cause/charity creation guidance.
 * Used by DynamicSidebar to provide contextual help.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 * Last Modified Summary: Initial cause guidance content
 */

import React from 'react';
import {
  Heart,
  FileText,
  DollarSign,
  Tag,
  Target,
  Bitcoin,
  Zap,
  Users,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export type CauseFieldType =
  | 'title'
  | 'description'
  | 'cause_category'
  | 'goal_sats'
  | 'currency'
  | 'bitcoin_address'
  | 'lightning_address'
  | 'beneficiaries'
  | null;

export const causeGuidanceContent: Record<NonNullable<CauseFieldType>, GuidanceContent> = {
  title: {
    icon: React.createElement(Heart, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Cause Title',
    description:
      "Your cause title should inspire action. Make it clear what you're raising funds for.",
    tips: [
      "Be specific about what you're funding",
      'Create emotional connection',
      'Include location or beneficiary if relevant',
      'Keep it under 60 characters',
      'Use action-oriented language',
    ],
    examples: [
      'Help Build a School in Guatemala',
      "Medical Treatment for Maria's Recovery",
      'Clean Water Project - Kenya Village',
      'Support Local Animal Shelter Renovation',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Cause Description',
    description:
      'Tell the story behind your cause. Help donors understand the impact of their contribution.',
    tips: [
      "Explain the problem you're addressing",
      'Share who will benefit and how',
      'Be transparent about fund usage',
      'Include timeline and milestones',
      'Add personal story or connection',
      'Explain why Bitcoin donations help',
    ],
    examples: [
      'Our village of 500 families has no access to clean water. With your help, we can install a well system...',
      'Maria, a single mother of three, needs surgery that will cost $15,000. Every satoshi brings her closer...',
    ],
  },
  cause_category: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Cause Category',
    description:
      'Categories help donors find causes they care about. Choose the most accurate category.',
    tips: [
      'Pick the primary focus of your cause',
      'If multiple apply, choose the main one',
      'Categories affect search and discovery',
      'Consider what donors would search for',
    ],
    examples: [
      'Education - Schools, scholarships, supplies',
      'Healthcare - Medical treatment, equipment',
      'Environment - Conservation, sustainability',
      'Poverty Relief - Basic needs, housing',
    ],
  },
  goal_sats: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Fundraising Goal',
    description: 'Set a realistic fundraising goal. Leave empty for open-ended fundraising.',
    tips: [
      'Calculate actual costs needed',
      'Include all expenses and buffer',
      'Breaking into milestones increases trust',
      'Open-ended works for ongoing causes',
      'You can exceed your goal',
    ],
    examples: [
      '10,000,000 sats (~$10,000) - Small project',
      '50,000,000 sats (~$50,000) - Medium project',
      'Open-ended - Ongoing support',
    ],
  },
  currency: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Display Currency',
    description: 'Choose how to display your goal. All donations are received in Bitcoin.',
    tips: [
      'SATS is the Bitcoin standard',
      'Fiat display helps donors understand value',
      'Goal can be shown in any currency',
      'Actual donations always in Bitcoin',
    ],
    examples: ['10,000,000 SATS', '0.1 BTC', '$10,000 equivalent in BTC'],
  },
  bitcoin_address: {
    icon: React.createElement(Bitcoin, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Bitcoin Address',
    description:
      'Your Bitcoin address where on-chain donations will be sent. Use a dedicated address for transparency.',
    tips: [
      'Use a new, dedicated address for this cause',
      'Keep the private key secure',
      'Consider using xpub for address rotation',
      'On-chain for larger donations',
      'Never share your private key',
    ],
    examples: [
      'bc1q... (Native SegWit - lowest fees)',
      '3... (SegWit compatible)',
      '1... (Legacy - works everywhere)',
    ],
  },
  lightning_address: {
    icon: React.createElement(Zap, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Lightning Address',
    description: 'Lightning address for instant, low-fee donations. Great for smaller amounts.',
    tips: [
      'Looks like an email: you@wallet.com',
      'Instant settlement, near-zero fees',
      'Perfect for small donations',
      'Get one from Alby, Wallet of Satoshi, etc.',
      'Combines well with on-chain address',
    ],
    examples: ['yourcause@getalby.com', 'donations@walletofsatoshi.com', 'yourname@ln.tips'],
  },
  beneficiaries: {
    icon: React.createElement(Users, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Beneficiaries',
    description: 'Who will benefit from this fundraiser? Be transparent about where funds go.',
    tips: [
      'Name specific individuals or organizations',
      'Explain their connection to the cause',
      'Include their consent if named',
      'Increases donor trust',
    ],
    examples: [
      'The children of San Miguel Elementary',
      'Local Animal Rescue Center',
      'Maria Rodriguez and her family',
    ],
  },
};

export const causeDefaultGuidance: DefaultGuidance = {
  title: 'What is a Cause?',
  description:
    'Causes are charitable fundraisers for meaningful purposes. Education, healthcare, environment, or community - raise Bitcoin for what matters.',
  features: [
    {
      icon: React.createElement(Heart, { className: 'w-4 h-4 text-rose-600' }),
      text: 'Fundraise for meaningful causes',
    },
    {
      icon: React.createElement(Shield, { className: 'w-4 h-4 text-rose-600' }),
      text: 'Build trust through transparency',
    },
    {
      icon: React.createElement(CheckCircle2, { className: 'w-4 h-4 text-rose-600' }),
      text: 'Receive donations globally in Bitcoin',
    },
  ],
  hint: '💡 Click on any field to get specific guidance',
};



