/**
 * Research Wizard Configuration
 *
 * Wizard-compatible config for the unified EntityCreationWizard.
 * Maps existing research constants to the EntityConfig interface.
 *
 * Created: 2026-02-24
 */

import { Microscope } from 'lucide-react';
import { z } from 'zod';
import {
  RESEARCH_FIELDS,
  METHODOLOGIES,
  TIMELINES,
  FUNDING_MODELS,
  PROGRESS_FREQUENCIES,
  TRANSPARENCY_LEVELS,
} from '@/config/research';
import {
  researchGuidanceContent,
  researchDefaultGuidance,
} from '@/lib/entity-guidance/research-guidance';
import type { FieldGroup, EntityTemplate } from '@/components/create/types';
import { createEntityConfig } from './base-config-factory';

// ==================== FORM DATA TYPE ====================

export type ResearchWizardFormData = {
  title: string;
  description: string;
  field: string;
  methodology: string;
  expected_outcome: string;
  timeline: string;
  funding_goal_sats: number;
  funding_model: string;
  lead_researcher: string;
  open_collaboration: boolean;
  progress_frequency: string;
  transparency_level: string;
  voting_enabled: boolean;
  is_public: boolean;
};

// ==================== VALIDATION SCHEMA ====================

const researchWizardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  field: z.string().min(1, 'Research field is required'),
  methodology: z.string().min(1, 'Methodology is required'),
  expected_outcome: z.string().min(1, 'Expected outcome is required').max(1000),
  timeline: z.string().min(1, 'Timeline is required'),
  funding_goal_sats: z.number().min(1000, 'Funding goal must be at least 1,000'),
  funding_model: z.string().min(1, 'Funding model is required'),
  lead_researcher: z.string().min(1, 'Lead researcher is required'),
  open_collaboration: z.boolean().optional().default(true),
  progress_frequency: z.string().min(1, 'Progress frequency is required'),
  transparency_level: z.string().min(1, 'Transparency level is required'),
  voting_enabled: z.boolean().optional().default(true),
  is_public: z.boolean().optional().default(true),
});

// ==================== FIELD GROUPS ====================

const fieldGroups: FieldGroup[] = [
  {
    id: 'basic',
    title: 'Basic Research Information',
    description: 'Define your research question and approach',
    fields: [
      {
        name: 'title',
        label: 'Research Title',
        type: 'text',
        placeholder: 'The fundamental question your research addresses',
        required: true,
        colSpan: 2,
      },
      {
        name: 'description',
        label: 'Research Description',
        type: 'textarea',
        placeholder: 'What understanding are you pursuing? What problem are you solving?',
        rows: 4,
        required: true,
        colSpan: 2,
      },
      {
        name: 'field',
        label: 'Research Field',
        type: 'select',
        required: true,
        options: [...RESEARCH_FIELDS],
        colSpan: 1,
      },
      {
        name: 'methodology',
        label: 'Research Methodology',
        type: 'select',
        required: true,
        options: [...METHODOLOGIES],
        colSpan: 1,
      },
      {
        name: 'expected_outcome',
        label: 'Expected Outcome',
        type: 'textarea',
        placeholder: 'What understanding or breakthrough do you hope to achieve?',
        rows: 3,
        required: true,
        colSpan: 2,
      },
      {
        name: 'timeline',
        label: 'Research Timeline',
        type: 'select',
        required: true,
        options: [...TIMELINES],
        colSpan: 2,
      },
    ],
  },
  {
    id: 'funding',
    title: 'Funding & Resources',
    description: 'How your research will be funded',
    fields: [
      {
        name: 'funding_goal_sats',
        label: 'Funding Goal',
        type: 'number',
        placeholder: '1000000',
        required: true,
        min: 1000,
        hint: 'Enter the total funding needed.',
        colSpan: 1,
      },
      {
        name: 'funding_model',
        label: 'Funding Model',
        type: 'select',
        required: true,
        options: [...FUNDING_MODELS],
        colSpan: 1,
      },
    ],
  },
  {
    id: 'team',
    title: 'Research Team',
    description: 'Who will be working on this research',
    fields: [
      {
        name: 'lead_researcher',
        label: 'Lead Researcher',
        type: 'text',
        placeholder: 'Your name or the primary researcher',
        required: true,
        colSpan: 2,
      },
      {
        name: 'open_collaboration',
        label: 'Open to New Collaborators',
        type: 'checkbox',
        hint: 'Allow other researchers to join this project',
        colSpan: 2,
      },
    ],
  },
  {
    id: 'transparency',
    title: 'Progress & Transparency',
    description: 'How you will share progress and involve the community',
    fields: [
      {
        name: 'progress_frequency',
        label: 'Progress Update Frequency',
        type: 'select',
        required: true,
        options: [...PROGRESS_FREQUENCIES],
        colSpan: 1,
      },
      {
        name: 'transparency_level',
        label: 'Transparency Level',
        type: 'select',
        required: true,
        options: [...TRANSPARENCY_LEVELS],
        colSpan: 1,
      },
      {
        name: 'voting_enabled',
        label: 'Enable Community Voting',
        type: 'checkbox',
        hint: 'Allow supporters to vote on research direction and priorities',
        colSpan: 2,
      },
      {
        name: 'is_public',
        label: 'Make Research Public',
        type: 'checkbox',
        hint: 'Make this research entity visible to everyone',
        colSpan: 2,
      },
    ],
  },
];

// ==================== DEFAULT VALUES ====================

const defaultValues: ResearchWizardFormData = {
  title: '',
  description: '',
  field: '',
  methodology: '',
  expected_outcome: '',
  timeline: '',
  funding_goal_sats: 0,
  funding_model: 'donation',
  lead_researcher: '',
  open_collaboration: true,
  progress_frequency: 'monthly',
  transparency_level: 'progress',
  voting_enabled: true,
  is_public: true,
};

// ==================== TEMPLATES ====================

const RESEARCH_TEMPLATES: EntityTemplate<ResearchWizardFormData>[] = [
  {
    id: 'academic',
    icon: '🎓',
    name: 'Academic Research',
    tagline: 'Traditional research with peer review and publication goals',
    defaults: {
      methodology: 'empirical',
      funding_model: 'milestone',
      progress_frequency: 'monthly',
      transparency_level: 'full',
      voting_enabled: false,
      open_collaboration: false,
      is_public: true,
    },
  },
  {
    id: 'community-survey',
    icon: '📊',
    name: 'Community Survey',
    tagline: 'Gather data and insights from the community',
    defaults: {
      methodology: 'survey',
      funding_model: 'donation',
      timeline: 'short_term',
      progress_frequency: 'weekly',
      transparency_level: 'full',
      voting_enabled: true,
      open_collaboration: true,
      is_public: true,
    },
  },
  {
    id: 'open-source-rd',
    icon: '🔬',
    name: 'Open Source R&D',
    tagline: 'Collaborative research with open results and shared findings',
    defaults: {
      methodology: 'computational',
      funding_model: 'subscription',
      progress_frequency: 'biweekly',
      transparency_level: 'full',
      voting_enabled: true,
      open_collaboration: true,
      is_public: true,
    },
  },
];

// ==================== EXPORT CONFIG ====================

export const researchWizardConfig = createEntityConfig<ResearchWizardFormData>({
  entityType: 'research',
  name: 'Research',
  namePlural: 'Research',
  icon: Microscope,
  colorTheme: 'purple',
  backUrl: '/dashboard/research',
  successUrl: '/dashboard/research/[id]',
  pageTitle: 'Create Research',
  pageDescription: 'Launch your independent research with decentralized funding',
  formTitle: 'Research Details',
  formDescription: 'Define your research question, methodology, and funding needs.',
  fieldGroups,
  validationSchema: researchWizardSchema,
  defaultValues,
  guidanceContent: researchGuidanceContent,
  defaultGuidance: researchDefaultGuidance,
  templates: RESEARCH_TEMPLATES,
  infoBanner: {
    title: 'Transparency Commitment',
    content:
      'By creating this research entity, you commit to providing regular progress updates and using all received funds for the stated research purpose.',
    variant: 'warning',
  },
});
