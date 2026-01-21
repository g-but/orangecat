/**
 * DOCUMENT ENTITY CONFIGURATION (FORM)
 *
 * Defines the form structure, validation, and guidance for document creation.
 * Documents provide personal context for My Cat AI assistant.
 *
 * Created: 2026-01-20
 * Last Modified: 2026-01-20
 * Last Modified Summary: Initial document form configuration
 */

import { FileText } from 'lucide-react';
import { documentSchema, type DocumentFormData } from '@/lib/validation';
import {
  documentGuidanceContent,
  documentDefaultGuidance,
} from '@/lib/entity-guidance/document-guidance';
import type { FieldGroup } from '@/components/create/types';
import { createEntityConfig } from './base-config-factory';

// ==================== FIELD GROUPS ====================

const fieldGroups: FieldGroup[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Give your document a clear title',
    fields: [
      {
        name: 'title',
        label: 'Document Title',
        type: 'text',
        placeholder: 'e.g., My 2026 Goals, Financial Situation, Skills Summary',
        required: true,
        colSpan: 2,
      },
    ],
  },
  {
    id: 'type',
    title: 'Document Type',
    description: 'Choose the type that best describes this document',
    fields: [
      {
        name: 'document_type',
        label: 'Type',
        type: 'select',
        required: true,
        options: [
          {
            value: 'goals',
            label: 'Goals & Aspirations',
            description: 'Your objectives and dreams',
          },
          { value: 'finances', label: 'Financial Info', description: 'Budget, income, expenses' },
          {
            value: 'skills',
            label: 'Skills & Expertise',
            description: 'Your abilities and experience',
          },
          {
            value: 'business_plan',
            label: 'Business Plan',
            description: 'Startup ideas and strategies',
          },
          { value: 'notes', label: 'Notes', description: 'General notes and information' },
          { value: 'other', label: 'Other', description: 'Anything else' },
        ],
        colSpan: 1,
      },
      {
        name: 'visibility',
        label: 'Visibility',
        type: 'select',
        required: true,
        options: [
          {
            value: 'cat_visible',
            label: 'My Cat Only',
            description: 'My Cat can use this for advice',
          },
          {
            value: 'private',
            label: 'Private',
            description: 'Only you can see, My Cat cannot access',
          },
          { value: 'public', label: 'Public', description: 'Anyone can see on your profile' },
        ],
        colSpan: 1,
        hint: 'Choose "My Cat Only" for documents you want My Cat to use for personalized advice.',
      },
    ],
  },
  {
    id: 'content',
    title: 'Content',
    description: 'Write the information you want My Cat to know',
    fields: [
      {
        name: 'content',
        label: 'Document Content',
        type: 'textarea',
        placeholder:
          'Write about your goals, skills, finances, or any other context that will help My Cat give you better advice...',
        rows: 12,
        colSpan: 2,
        hint: 'Be detailed - the more context you provide, the better advice My Cat can give.',
      },
    ],
  },
  {
    id: 'tags',
    title: 'Organization',
    description: 'Add tags to help organize your documents',
    fields: [
      {
        name: 'tags',
        label: 'Tags',
        type: 'tags',
        placeholder: 'Add tags (press Enter after each)',
        colSpan: 2,
        hint: 'Optional: Add keywords to help find and organize this document.',
      },
    ],
  },
];

// ==================== CONFIGURATION ====================

export const documentFormConfig = createEntityConfig<DocumentFormData>({
  entityType: 'document',
  name: 'Document',
  namePlural: 'Documents',
  icon: FileText,
  colorTheme: 'indigo',
  backUrl: '/dashboard/documents',
  successUrl: '/dashboard/documents',
  pageTitle: 'Add Context',
  pageDescription: 'Add a document to help My Cat understand your goals, skills, and situation.',
  formTitle: 'Document Details',
  formDescription: 'Provide context that My Cat can use to give you personalized advice',
  fieldGroups,
  validationSchema: documentSchema,
  defaultValues: {
    title: '',
    content: '',
    document_type: 'notes',
    visibility: 'cat_visible',
    tags: [],
  },
  guidanceContent: documentGuidanceContent,
  defaultGuidance: documentDefaultGuidance,
  infoBanner: {
    title: 'Help My Cat Help You',
    content:
      'Documents you mark as "My Cat Only" or "Public" will be used by My Cat to give you personalized advice. The more context you provide, the better advice you will receive.',
    variant: 'info',
  },
  successMessage: 'Document saved! My Cat now has more context to help you.',
  successRedirectDelay: 1500,
});
