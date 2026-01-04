/**
 * ORGANIZATION ENTITY CONFIGURATION
 *
 * Defines the form structure, validation, and guidance for organization creation.
 *
 * Created: 2025-12-06
 * Last Modified: 2025-12-06
 * Last Modified Summary: Initial organization configuration
 */

import { Building2, Users, Globe, Bitcoin } from 'lucide-react';
import { organizationSchema, type OrganizationFormData } from '@/lib/validation';
import {
  organizationGuidanceContent,
  organizationDefaultGuidance,
} from '@/lib/entity-guidance/organization-guidance';
import type { EntityConfig, FieldGroup } from '@/components/create/types';
import { ORGANIZATION_TEMPLATES, type OrganizationTemplate } from '@/components/create/templates';

// ==================== FIELD GROUPS ====================

const fieldGroups: FieldGroup[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Essential details about your organization',
    fields: [
      {
        name: 'name',
        label: 'Organization Name',
        type: 'text',
        placeholder: 'e.g., Orange Cat Collective',
        required: true,
        colSpan: 2,
      },
      {
        name: 'slug',
        label: 'Organization Slug',
        type: 'text',
        placeholder: 'e.g., orange-cat',
        required: true,
        hint: 'URL-friendly identifier, auto-generated from name',
      },
      {
        name: 'type',
        label: 'Organization Type',
        type: 'select',
        required: true,
        options: [
          { value: 'community', label: 'Community', description: 'Grassroots community organization' },
          { value: 'collective', label: 'Collective', description: 'Worker-owned cooperative' },
          { value: 'dao', label: 'DAO', description: 'Decentralized Autonomous Organization' },
          { value: 'company', label: 'Company', description: 'Traditional business structure' },
          { value: 'nonprofit', label: 'Non-Profit', description: 'Charitable organization' },
          { value: 'foundation', label: 'Foundation', description: 'Grant-making foundation' },
          { value: 'guild', label: 'Guild', description: 'Professional guild or association' },
          { value: 'circle', label: 'Circle', description: 'Trust-based community circle' },
        ],
      },
    ],
  },
  {
    id: 'details',
    title: 'Organization Details',
    description: 'Additional information about your organization',
    fields: [
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Describe your organization\'s mission and activities...',
        rows: 4,
        colSpan: 2,
        hint: 'What does your organization do? Who are your members?',
      },
      {
        name: 'category',
        label: 'Category',
        type: 'text',
        placeholder: 'e.g., Technology, Education, Finance',
        hint: 'Optional: Categorize your organization for discovery',
      },
      {
        name: 'website_url',
        label: 'Website',
        type: 'url',
        placeholder: 'https://your-organization.com',
        hint: 'Optional: Your organization\'s website URL',
      },
      {
        name: 'governance_model',
        label: 'Governance Model',
        type: 'select',
        required: true,
        options: [
          { value: 'hierarchical', label: 'Hierarchical', description: 'Traditional top-down structure' },
          { value: 'flat', label: 'Flat', description: 'Equal participation' },
          { value: 'democratic', label: 'Democratic', description: 'Voting-based decisions' },
          { value: 'consensus', label: 'Consensus', description: 'Unanimous agreement required' },
          { value: 'liquid_democracy', label: 'Liquid Democracy', description: 'Delegated voting system' },
          { value: 'quadratic_voting', label: 'Quadratic Voting', description: 'Cost-scaled voting' },
          { value: 'stake_weighted', label: 'Stake Weighted', description: 'Voting power based on stake' },
          { value: 'reputation_based', label: 'Reputation Based', description: 'Voting power based on reputation' },
        ],
      },
    ],
  },
  {
    id: 'visibility',
    title: 'Visibility & Membership',
    description: 'Control who can see and join your organization',
    fields: [
      {
        name: 'is_public',
        label: 'Public Organization',
        type: 'checkbox',
        hint: 'Public organizations are visible to everyone and appear in search results',
      },
      {
        name: 'requires_approval',
        label: 'Require Approval for Membership',
        type: 'checkbox',
        hint: 'If enabled, new members must be approved before joining',
      },
    ],
  },
  {
    id: 'treasury',
    title: 'Treasury & Bitcoin',
    description: 'Bitcoin addresses for treasury and lightning payments',
    fields: [
      {
        name: 'treasury_address',
        label: 'Bitcoin Treasury Address',
        type: 'bitcoin_address',
        placeholder: 'bc1q... or 1...',
        hint: 'Primary Bitcoin address for your organization\'s treasury',
      },
      {
        name: 'lightning_address',
        label: 'Lightning Address',
        type: 'text',
        placeholder: 'your-org@lightning.address',
        hint: 'Optional: Lightning Network payment address for instant payments',
      },
    ],
  },
];

// ==================== CONFIGURATION ====================

export const organizationConfig: EntityConfig<OrganizationFormData> = {
  // Entity metadata
  type: 'organization',
  name: 'Organization',
  namePlural: 'Organizations',

  // Icons
  icon: Building2,
  colorTheme: 'green',

  // Navigation
  backUrl: '/organizations',
  successUrl: '/organizations/[slug]',

  // API configuration
  apiEndpoint: '/api/organizations',

  // UI configuration
  pageTitle: 'Create Organization',
  pageDescription: 'Form a new Bitcoin-powered organization with governance and treasury management.',
  formTitle: 'Organization Details',
  formDescription: 'Set up your organization\'s basic information',

  // Form configuration
  fieldGroups,
  validationSchema: organizationSchema,
  defaultValues: {
    name: '',
    slug: '',
    description: '',
    type: 'community',
    category: '',
    tags: [],
    governance_model: 'hierarchical',
    website_url: '',
    treasury_address: '',
    lightning_address: '',
    avatar_url: '',
    banner_url: '',
    is_public: true,
    requires_approval: true,
  },

  // Guidance
  guidanceContent: organizationGuidanceContent,
  defaultGuidance: organizationDefaultGuidance,

  // Templates
  templates: ORGANIZATION_TEMPLATES as unknown as OrganizationTemplate[],

  // Success messaging
  successMessage: 'Organization created successfully!',
};





















