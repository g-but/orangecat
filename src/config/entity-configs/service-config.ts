/**
 * SERVICE ENTITY CONFIGURATION
 *
 * Defines the form structure, validation, and guidance for service creation.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 */

import { Briefcase } from 'lucide-react';
import { userServiceSchema, type UserServiceFormData } from '@/lib/validation';
import {
  serviceGuidanceContent,
  serviceDefaultGuidance,
} from '@/lib/entity-guidance/service-guidance';
import type { EntityConfig, FieldGroup } from '@/components/create/types';

// ==================== CONSTANTS ====================

const SERVICE_CATEGORIES = [
  'Consulting',
  'Design',
  'Development',
  'Marketing',
  'Writing',
  'Teaching',
  'Coaching',
  'Photography',
  'Video',
  'Music',
  'Translation',
  'Legal',
  'Accounting',
  'Other',
];

// ==================== FIELD GROUPS ====================

const fieldGroups: FieldGroup[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Essential details about your service',
    fields: [
      {
        name: 'title',
        label: 'Service Title',
        type: 'text',
        placeholder: 'e.g., Bitcoin Consulting, Web Development',
        required: true,
        colSpan: 2,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Describe your service in detail - what you offer, your experience, what clients can expect...',
        rows: 4,
        colSpan: 2,
      },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: SERVICE_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
        colSpan: 2,
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing',
    description: 'Set at least one pricing option (hourly or fixed price)',
    fields: [
      {
        name: 'hourly_rate_sats',
        label: 'Hourly Rate',
        type: 'currency',
        placeholder: '50.00',
        min: 1,
        hint: 'Your rate per hour. Enter in your preferred currency.',
      },
      {
        name: 'fixed_price_sats',
        label: 'Fixed Price',
        type: 'currency',
        placeholder: '500.00',
        min: 1,
        hint: 'Fixed project price. Enter in your preferred currency.',
      },
      {
        name: 'duration_minutes',
        label: 'Typical Duration (minutes)',
        type: 'number',
        placeholder: 'e.g., 60',
        min: 1,
        hint: 'How long does a typical session last?',
        colSpan: 2,
      },
    ],
  },
  {
    id: 'location',
    title: 'Location & Availability',
    description: 'Where can you deliver your service?',
    fields: [
      {
        name: 'service_location_type',
        label: 'Service Location',
        type: 'select',
        options: [
          { value: 'remote', label: 'Remote Only' },
          { value: 'onsite', label: 'On-site Only' },
          { value: 'both', label: 'Both Remote & On-site' },
        ],
        colSpan: 2,
      },
      {
        name: 'service_area',
        label: 'Service Area',
        type: 'text',
        placeholder: 'e.g., Zurich, Switzerland',
        hint: 'Where can you provide on-site services?',
        showWhen: {
          field: 'service_location_type',
          value: ['onsite', 'both'],
        },
        colSpan: 2,
      },
    ],
  },
];

// ==================== DEFAULT VALUES ====================

const defaultValues: UserServiceFormData = {
  title: '',
  description: '',
  category: '',
  hourly_rate_sats: null,
  fixed_price_sats: null,
  currency: 'SATS',
  duration_minutes: null,
  service_location_type: 'remote',
  service_area: '',
  images: [],
  portfolio_links: [],
  status: 'draft',
};

// ==================== EXPORT CONFIG ====================

export const serviceConfig: EntityConfig<UserServiceFormData> = {
  type: 'service',
  name: 'Service',
  namePlural: 'Services',
  icon: Briefcase,
  colorTheme: 'tiffany',
  backUrl: '/dashboard/services',
  apiEndpoint: '/api/services',
  successUrl: '/dashboard/services',
  pageTitle: 'Create Service',
  pageDescription: 'Offer your expertise to the community',
  formTitle: 'Service Details',
  formDescription: 'Fill in the information for your new service offering. You can always edit these details later.',
  fieldGroups,
  validationSchema: userServiceSchema,
  defaultValues,
  guidanceContent: serviceGuidanceContent as any,
  defaultGuidance: serviceDefaultGuidance,
};

