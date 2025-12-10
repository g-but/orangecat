/**
 * CIRCLE ENTITY CONFIGURATION
 *
 * Defines the form structure, validation, and guidance for circle creation.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-12-04
 */

import { z } from 'zod';
import { Users } from 'lucide-react';
import {
  circleGuidanceContent,
  circleDefaultGuidance,
} from '@/lib/entity-guidance/circle-guidance';
import type { EntityConfig, FieldGroup } from '@/components/create/types';

// ==================== CONSTANTS ====================

const CIRCLE_CATEGORIES = [
  'Family',
  'Friends',
  'Community',
  'Professional',
  'Hobby',
  'Charity',
  'Investment',
  'Emergency Fund',
  'Travel',
  'Other',
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can find and request to join' },
  { value: 'private', label: 'Private', description: 'Only invited members can join' },
  { value: 'hidden', label: 'Hidden', description: 'Invisible to non-members' },
];

const APPROVAL_OPTIONS = [
  { value: 'auto', label: 'Auto-approve', description: 'Anyone can join instantly' },
  { value: 'manual', label: 'Manual approval', description: 'Admin reviews each request' },
  { value: 'invite', label: 'Invite-only', description: 'Only invited users can join' },
];

// ==================== VALIDATION SCHEMA ====================

const circleSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be under 50 characters'),
  description: z.string().max(500, 'Description must be under 500 characters').optional().nullable(),
  category: z.string().min(1, 'Please select a category'),
  visibility: z.enum(['public', 'private', 'hidden']).default('private'),
  max_members: z.number().int().positive().optional().nullable(),
  bitcoin_address: z.string().optional().nullable(),
  wallet_purpose: z.string().max(200).optional().nullable(),
  member_approval: z.enum(['auto', 'manual', 'invite']).default('manual'),
});

type CircleFormData = z.infer<typeof circleSchema>;

// ==================== FIELD GROUPS ====================

const fieldGroups: FieldGroup[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Define your circle\'s identity',
    fields: [
      {
        name: 'name',
        label: 'Circle Name',
        type: 'text',
        placeholder: 'e.g., Zurich Bitcoin Meetup',
        required: true,
        colSpan: 2,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'What is your circle about? Who should join?',
        rows: 3,
        colSpan: 2,
      },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: CIRCLE_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
      },
      {
        name: 'visibility',
        label: 'Visibility',
        type: 'select',
        options: VISIBILITY_OPTIONS,
      },
    ],
  },
  {
    id: 'membership',
    title: 'Membership Settings',
    description: 'Control how people join your circle',
    fields: [
      {
        name: 'member_approval',
        label: 'Member Approval',
        type: 'select',
        options: APPROVAL_OPTIONS,
      },
      {
        name: 'max_members',
        label: 'Maximum Members',
        type: 'number',
        placeholder: 'Leave empty for unlimited',
        min: 2,
        hint: 'Leave empty for unlimited members',
      },
    ],
  },
  {
    id: 'wallet',
    title: 'Circle Wallet (Optional)',
    description: 'Connect a shared Bitcoin wallet for the circle',
    fields: [
      {
        name: 'bitcoin_address',
        label: 'Bitcoin Address',
        type: 'bitcoin_address',
        placeholder: 'bc1q... or xpub...',
        colSpan: 2,
      },
      {
        name: 'wallet_purpose',
        label: 'Wallet Purpose',
        type: 'text',
        placeholder: 'e.g., Family emergency fund',
        hint: 'Describe what the shared wallet will be used for',
        colSpan: 2,
      },
    ],
  },
];

// ==================== DEFAULT VALUES ====================

const defaultValues: CircleFormData = {
  name: '',
  description: '',
  category: '',
  visibility: 'private',
  max_members: null,
  bitcoin_address: '',
  wallet_purpose: '',
  member_approval: 'manual',
};

// ==================== EXPORT CONFIG ====================

export const circleConfig: EntityConfig<CircleFormData> = {
  type: 'circle',
  name: 'Circle',
  namePlural: 'Circles',
  icon: Users,
  colorTheme: 'purple',
  backUrl: '/circles',
  apiEndpoint: '/api/circles',
  successUrl: '/circles',
  pageTitle: 'Create Circle',
  pageDescription: 'Start a new circle for your family, friends, or community',
  formTitle: 'Circle Details',
  formDescription: 'Set up your circle. You can always change these settings later.',
  fieldGroups,
  validationSchema: circleSchema,
  defaultValues,
  guidanceContent: circleGuidanceContent as any,
  defaultGuidance: circleDefaultGuidance,
};



















