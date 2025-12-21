/**
 * CIRCLE ENTITY CONFIGURATION - ENHANCED
 *
 * Enhanced circle creation with advanced features and templates.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-12-16
 * Last Modified Summary: Added advanced circle features and templates
 */

import { Users, Heart, Briefcase, Zap, Target, Coins, MapPin } from 'lucide-react';
import {
  circleGuidanceContent,
  circleDefaultGuidance,
} from '@/lib/entity-guidance/circle-guidance';
import type { EntityConfig, FieldGroup } from '@/components/create/types';
import { userCircleSchema, type UserCircleFormData } from '@/lib/validation';

// ==================== ADVANCED CONSTANTS ====================

const CIRCLE_CATEGORIES = [
  // Social Circles
  'Family',
  'Friends',
  'Community',
  'Neighborhood',
  'Alumni',

  // Purpose Circles
  'Savings',
  'Investment',
  'Skill-Sharing',
  'Project',
  'Emergency',

  // Professional Circles
  'Freelancer',
  'Startup',
  'Consulting',
  'Mentorship',
  'Industry',

  // Community Circles
  'Charity',
  'Environmental',
  'Education',
  'Health',
  'Cultural',

  // Other
  'Travel',
  'Hobby',
  'Other',
];

const VISIBILITY_OPTIONS = [
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can find and request to join',
    icon: '🌐'
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only invited members can join',
    icon: '🔒'
  },
  {
    value: 'hidden',
    label: 'Hidden',
    description: 'Invisible to non-members',
    icon: '👻'
  },
];

const APPROVAL_OPTIONS = [
  {
    value: 'auto',
    label: 'Auto-approve',
    description: 'Anyone meeting criteria joins instantly',
    icon: '⚡'
  },
  {
    value: 'manual',
    label: 'Manual approval',
    description: 'Admin reviews each request',
    icon: '👀'
  },
  {
    value: 'invite',
    label: 'Invite-only',
    description: 'Only invited users can join',
    icon: '✉️'
  },
];

// Circle templates for quick creation
const CIRCLE_TEMPLATES = [
  {
    id: 'family-savings',
    name: 'Family Savings Circle',
    description: 'Coordinate family savings and emergency funds',
    category: 'Family',
    icon: '👨‍👩‍👧‍👦',
    suggestedSettings: {
      visibility: 'private',
      member_approval: 'invite',
      wallet_purpose: 'Family emergency fund and shared expenses'
    }
  },
  {
    id: 'bitcoin-investors',
    name: 'Bitcoin Investment Club',
    description: 'Group Bitcoin investing and education',
    category: 'Investment',
    icon: '₿',
    suggestedSettings: {
      visibility: 'private',
      member_approval: 'manual',
      wallet_purpose: 'Collective Bitcoin investments'
    }
  },
  {
    id: 'freelancer-network',
    name: 'Freelancer Network',
    description: 'Connect and collaborate with fellow freelancers',
    category: 'Freelancer',
    icon: '💼',
    suggestedSettings: {
      visibility: 'public',
      member_approval: 'auto',
      max_members: 50
    }
  },
  {
    id: 'neighborhood-aid',
    name: 'Neighborhood Mutual Aid',
    description: 'Support your local community',
    category: 'Community',
    icon: '🏘️',
    suggestedSettings: {
      visibility: 'public',
      member_approval: 'auto',
      wallet_purpose: 'Community projects and mutual aid'
    }
  },
  {
    id: 'skill-share',
    name: 'Skill Sharing Hub',
    description: 'Teach and learn new skills together',
    category: 'Skill-Sharing',
    icon: '🎓',
    suggestedSettings: {
      visibility: 'public',
      member_approval: 'auto'
    }
  }
];

// ==================== ENHANCED VALIDATION SCHEMA ====================
// Using centralized schema from @/lib/validation
const circleSchema = userCircleSchema;
type CircleFormData = UserCircleFormData;

// ==================== ENHANCED FIELD GROUPS ====================

const fieldGroups: FieldGroup[] = [
  {
    id: 'basic',
    title: 'Circle Identity',
    description: 'Define your circle\'s core identity and purpose',
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
        name: 'activity_level',
        label: 'Activity Level',
        type: 'select',
        options: [
          { value: 'casual', label: 'Casual - Occasional activities' },
          { value: 'regular', label: 'Regular - Weekly/monthly activities' },
          { value: 'intensive', label: 'Intensive - Daily collaboration' },
        ],
        hint: 'Expected engagement level for members',
      },
    ],
  },
  {
    id: 'membership',
    title: 'Membership & Access',
    description: 'Control how people join and participate',
    fields: [
      {
        name: 'visibility',
        label: 'Visibility',
        type: 'select',
        options: VISIBILITY_OPTIONS,
      },
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
      {
        name: 'require_member_intro',
        label: 'Require Member Introductions',
        type: 'boolean',
        hint: 'New members must introduce themselves',
      },
    ],
  },
  {
    id: 'location',
    title: 'Location Settings (Optional)',
    description: 'Restrict circle to specific geographic area',
    fields: [
      {
        name: 'location_restricted',
        label: 'Restrict to Geographic Area',
        type: 'boolean',
        hint: 'Limit membership to people within a certain distance',
      },
      {
        name: 'location_radius_km',
        label: 'Radius (km)',
        type: 'number',
        placeholder: '50',
        min: 1,
        max: 1000,
        dependsOn: 'location_restricted',
        hint: 'Maximum distance from circle center',
      },
    ],
  },
  {
    id: 'economic',
    title: 'Economic Features',
    description: 'Set up financial aspects of your circle',
    fields: [
      {
        name: 'contribution_required',
        label: 'Require Member Contributions',
        type: 'boolean',
        hint: 'Members must contribute to participate',
      },
      {
        name: 'contribution_amount',
        label: 'Monthly Contribution (SATS)',
        type: 'currency',
        placeholder: '1000',
        min: 1,
        dependsOn: 'contribution_required',
        hint: 'Required monthly contribution in SATS',
      },
    ],
  },
  {
    id: 'wallet',
    title: 'Shared Bitcoin Wallet (Optional)',
    description: 'Connect a Bitcoin wallet for collective goals',
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
  {
    id: 'features',
    title: 'Circle Features',
    description: 'Enable optional features for your circle',
    fields: [
      {
        name: 'enable_discussions',
        label: 'Discussion Forums',
        type: 'boolean',
        defaultValue: true,
        hint: 'Allow members to create discussion topics',
      },
      {
        name: 'enable_events',
        label: 'Event Planning',
        type: 'boolean',
        defaultValue: true,
        hint: 'Allow members to organize events',
      },
      {
        name: 'enable_projects',
        label: 'Project Collaboration',
        type: 'boolean',
        hint: 'Allow members to create and manage projects',
      },
      {
        name: 'meeting_frequency',
        label: 'Regular Meetings',
        type: 'select',
        options: [
          { value: 'none', label: 'No regular meetings' },
          { value: 'weekly', label: 'Weekly meetings' },
          { value: 'monthly', label: 'Monthly meetings' },
          { value: 'quarterly', label: 'Quarterly meetings' },
        ],
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
  member_approval: 'manual',
  location_restricted: false,
  location_radius_km: null,
  bitcoin_address: '',
  wallet_purpose: '',
  contribution_required: false,
  contribution_amount: null,
  activity_level: 'regular',
  meeting_frequency: 'none',
  enable_projects: false,
  enable_events: true,
  enable_discussions: true,
  require_member_intro: false,
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
  successUrl: '/circles/[id]',
  pageTitle: 'Create Circle',
  pageDescription: 'Start a new circle for your family, friends, or community',
  formTitle: 'Circle Details',
  formDescription: 'Set up your circle with advanced features for better collaboration.',
  fieldGroups,
  validationSchema: circleSchema,
  defaultValues,
  guidanceContent: circleGuidanceContent as any,
  defaultGuidance: circleDefaultGuidance,
  templates: CIRCLE_TEMPLATES,
};