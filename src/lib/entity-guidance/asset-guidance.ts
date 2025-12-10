/**
 * Asset Field Guidance Content
 *
 * Single source of truth for asset creation guidance.
 * Used by DynamicSidebar to provide contextual help.
 *
 * Created: 2025-12-05
 * Last Modified: 2025-12-05
 * Last Modified Summary: Align asset guidance with unified pattern and fix JSX parsing
 */

import React from 'react';
import { Briefcase } from 'lucide-react';
import type { DefaultGuidance, GuidanceContent } from '@/components/create/types';

const assetIcon = (size: 'sm' | 'md' = 'md') =>
  React.createElement(Briefcase, { className: size === 'sm' ? 'w-4 h-4 text-blue-600' : 'w-5 h-5 text-blue-600' });

export const assetDefaultGuidance: DefaultGuidance = {
  title: 'About Assets',
  description:
    'List non-Bitcoin assets (property, business, equipment, portfolios, etc.). You can reference an asset as collateral when creating a loan. OrangeCat does not verify user-submitted information — do your own due diligence.',
  features: [
    { icon: assetIcon('sm'), text: 'Use assets as loan collateral' },
    { icon: assetIcon('sm'), text: 'Attach documents or links for context' },
    { icon: assetIcon('sm'), text: 'Keep descriptions accurate and concise' },
  ],
  hint: 'Avoid sharing sensitive personal information in public descriptions.',
};

export const assetGuidanceContent: Record<string, GuidanceContent> = {
  title: {
    icon: assetIcon('sm'),
    title: 'Title',
    description: 'A short, clear name identifying the asset. Example: “123 Main St Apartment” or “Café Orange LLC”.',
    tips: ['Keep it under 100 characters', 'Avoid sensitive info'],
    examples: ['Investment Property – 2BR Apartment', 'OrangeCat Equipment – S19 Miner'],
  },
  type: {
    icon: assetIcon('sm'),
    title: 'Type',
    description: 'Choose the category that best fits this asset.',
    tips: ['Real estate, business, vehicle, equipment, securities, other'],
  },
  description: {
    icon: assetIcon('sm'),
    title: 'Description',
    description: 'Key facts about your asset. Keep it accurate and concise.',
    tips: ['Condition and location context', 'Ownership details (if relevant)', 'No sensitive personal data'],
  },
  location: {
    icon: assetIcon('sm'),
    title: 'Location',
    description: 'City/region for the asset. Do not include exact addresses unless necessary.',
    tips: ['City + Country is enough initially'],
  },
  estimated_value: {
    icon: assetIcon('sm'),
    title: 'Estimated Value',
    description: 'Approximate valuation of your asset.',
    tips: ['Use a realistic value', 'You can leave it empty if unknown'],
  },
  currency: {
    icon: assetIcon('sm'),
    title: 'Currency',
    description: 'Currency for the estimated value (USD, CHF, EUR, BTC).',
    tips: ['Choose currency you track this asset in'],
  },
};

