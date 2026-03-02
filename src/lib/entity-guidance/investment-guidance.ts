/**
 * Investment Field Guidance Content
 *
 * Contextual help for investment creation form.
 */

import React from 'react';
import { TrendingUp, FileText, Target, Bitcoin, Shield } from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export const investmentGuidanceContent: Record<string, GuidanceContent> = {
  title: {
    icon: React.createElement(TrendingUp, { className: 'w-5 h-5 text-green-600' }),
    title: 'Investment Title',
    description: 'Choose a clear title that describes the investment opportunity.',
    tips: [
      'Be specific about the opportunity',
      'Include the type of return (equity, revenue share)',
      'Keep it concise but informative',
    ],
    examples: [
      'Restaurant Revenue Share — 12% Annual Returns',
      'SaaS Equity Round — Series Seed',
      'Real Estate Profit Share — Zurich Development',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-green-600' }),
    title: 'Description',
    description: 'Explain the investment opportunity in detail.',
    tips: [
      'Describe how funds will be used',
      'Explain the return mechanism',
      'Include relevant track record',
      'Be transparent about risks',
    ],
  },
  target_amount: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-green-600' }),
    title: 'Fundraising Target',
    description: 'The total amount you want to raise from investors.',
    tips: [
      'Set a realistic target',
      'Consider minimum viable funding',
      'All amounts are in your display currency',
    ],
  },
  bitcoin_address: {
    icon: React.createElement(Bitcoin, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Bitcoin Payment',
    description: 'Provide a Bitcoin or Lightning address to receive investments.',
    tips: [
      'Use a dedicated address for this investment',
      'Lightning enables instant micro-investments',
    ],
  },
  terms: {
    icon: React.createElement(Shield, { className: 'w-5 h-5 text-green-600' }),
    title: 'Investment Terms',
    description: 'Detailed terms and conditions for investors.',
    tips: [
      'Be specific about return calculations',
      'Define exit conditions',
      'Include any vesting or lock-up periods',
      'Disclose all risks clearly',
    ],
  },
};

export const investmentDefaultGuidance: DefaultGuidance = {
  title: 'Create an Investment Opportunity',
  description:
    'Structure a deal for investors — equity, revenue share, or profit participation. Be transparent about terms and risks.',
  features: [
    {
      icon: React.createElement(TrendingUp, { className: 'w-4 h-4 text-green-600' }),
      text: 'Multiple investment types supported',
    },
    {
      icon: React.createElement(Shield, { className: 'w-4 h-4 text-green-600' }),
      text: 'Transparent risk disclosure',
    },
    {
      icon: React.createElement(Bitcoin, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Accept investments via Bitcoin & Lightning',
    },
  ],
  hint: 'Complete all fields for the best investor experience.',
};
