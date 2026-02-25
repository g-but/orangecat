/**
 * CAUSE ENTITY CONFIGURATION
 *
 * Defines the form structure, validation, and guidance for cause/charity creation.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 */

import { Heart } from 'lucide-react';
import { userCauseSchema, type UserCauseFormData } from '@/lib/validation';
import { causeGuidanceContent, causeDefaultGuidance } from '@/lib/entity-guidance/cause-guidance';
import type { FieldGroup } from '@/components/create/types';
import { CAUSE_TEMPLATES, type CauseTemplate } from '@/components/create/templates';
import { createEntityConfig } from './base-config-factory';
import { WalletSelectorField } from '@/components/create/wallet-selector';

// ==================== CONSTANTS ====================

const CAUSE_CATEGORIES = [
  'Education',
  'Healthcare',
  'Environment',
  'Poverty Relief',
  'Animal Welfare',
  'Disaster Relief',
  'Human Rights',
  'Arts & Culture',
  'Community Development',
  'Technology Access',
  'Mental Health',
  'Veterans Support',
  'Children & Youth',
  'Elderly Care',
  'Other',
];

// ==================== FIELD GROUPS ====================

const fieldGroups: FieldGroup[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Tell the story of your cause',
    fields: [
      {
        name: 'title',
        label: 'Cause Title',
        type: 'text',
        placeholder: 'e.g., Help Build a School in Guatemala',
        required: true,
        colSpan: 2,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder:
          "Describe your cause in detail - what you're raising funds for, who will benefit, how the funds will be used...",
        rows: 5,
        colSpan: 2,
      },
      {
        name: 'cause_category',
        label: 'Category',
        type: 'select',
        required: true,
        options: CAUSE_CATEGORIES.map(cat => ({ value: cat, label: cat })),
        colSpan: 2,
      },
    ],
  },
  {
    id: 'goal',
    title: 'Fundraising Goal',
    description: 'Set your target amount (optional for open-ended fundraising)',
    fields: [
      {
        name: 'goal_amount',
        label: 'Goal Amount',
        type: 'currency',
        placeholder: '10000.00',
        min: 1,
        hint: 'Leave empty for open-ended fundraising. Enter in your preferred currency.',
        colSpan: 2,
      },
    ],
  },
  {
    id: 'payment',
    title: 'Bitcoin & Payments',
    description: 'Select a wallet or enter an address',
    customComponent: WalletSelectorField,
    fields: [
      { name: 'bitcoin_address', label: 'Bitcoin Address', type: 'bitcoin_address' },
      { name: 'lightning_address', label: 'Lightning Address', type: 'text' },
    ],
  },
  {
    id: 'visibility',
    title: 'Profile Visibility',
    description: 'Control where this cause appears',
    fields: [
      {
        name: 'show_on_profile',
        label: 'Show on Public Profile',
        type: 'checkbox',
        hint: 'When enabled, this cause will appear on your public profile page',
        colSpan: 2,
      },
    ],
  },
];

// ==================== DEFAULT VALUES ====================

const defaultValues: UserCauseFormData = {
  title: '',
  description: '',
  cause_category: '',
  goal_amount: null,
  currency: undefined, // Will be set from user's profile preference in EntityForm
  bitcoin_address: '',
  lightning_address: '',
  beneficiaries: [],
  status: 'draft',
};

// ==================== EXPORT CONFIG ====================

export const causeConfig = createEntityConfig<UserCauseFormData>({
  entityType: 'cause',
  name: 'Cause',
  namePlural: 'Causes',
  icon: Heart,
  colorTheme: 'rose',
  backUrl: '/dashboard/causes',
  successUrl: '/dashboard/causes/[id]',
  pageTitle: 'Create Cause',
  pageDescription: 'Start a charitable fundraising campaign',
  formTitle: 'Cause Details',
  formDescription:
    'Fill in the information for your charitable cause. Be clear about how funds will be used.',
  fieldGroups,
  validationSchema: userCauseSchema,
  defaultValues,
  guidanceContent: causeGuidanceContent,
  defaultGuidance: causeDefaultGuidance,
  templates: CAUSE_TEMPLATES as unknown as CauseTemplate[],
  infoBanner: {
    title: 'Transparency Commitment',
    content:
      'By creating this cause, you commit to using all received funds for the stated purpose and providing updates to your supporters about how their contributions are being used.',
    variant: 'warning',
  },
});
