import { Briefcase } from 'lucide-react'
import { z } from 'zod'
import type { EntityConfig, FieldGroup } from '@/components/create/types'
import { assetGuidanceContent, assetDefaultGuidance } from '@/lib/entity-guidance/asset-guidance'
import { CURRENCY_CODES, currencySelectOptions, DEFAULT_CURRENCY } from '@/config/currencies'

export const assetSchema = z.object({
  title: z.string().min(3).max(100),
  type: z.enum(['real_estate', 'business', 'vehicle', 'equipment', 'securities', 'other']),
  description: z.string().max(2000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  estimated_value: z.number().positive().optional().nullable(),
  currency: z.enum(CURRENCY_CODES).default(DEFAULT_CURRENCY),
  documents: z.array(z.string().url()).optional().nullable(),
})

export type AssetFormData = z.infer<typeof assetSchema>

const fieldGroups: FieldGroup[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Essential details about your asset',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, colSpan: 2, placeholder: 'e.g., 123 Main St Apartment' },
      {
        name: 'type',
        label: 'Asset Type',
        type: 'select',
        required: true,
        options: [
          { value: 'real_estate', label: 'Real Estate' },
          { value: 'business', label: 'Business' },
          { value: 'vehicle', label: 'Vehicle' },
          { value: 'equipment', label: 'Equipment' },
          { value: 'securities', label: 'Securities' },
          { value: 'other', label: 'Other' },
        ],
        colSpan: 2,
      },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4, colSpan: 2, placeholder: 'Describe the asset (avoid sensitive details)...' },
    ],
  },
  {
    id: 'details',
    title: 'Details',
    description: 'Location and estimated valuation',
    fields: [
      { name: 'location', label: 'Location', type: 'text', placeholder: 'City, Country' },
      { name: 'estimated_value', label: 'Estimated Value', type: 'number', min: 0 },
      {
        name: 'currency',
        label: 'Currency',
        type: 'select',
        options: currencySelectOptions,
      },
    ],
  },
]

const defaultValues: AssetFormData = {
  title: '',
  type: 'other',
  description: '',
  location: '',
  estimated_value: undefined,
  currency: DEFAULT_CURRENCY,
  documents: [],
}

export const assetConfig: EntityConfig<AssetFormData> = {
  type: 'asset',
  name: 'Asset',
  namePlural: 'Assets',
  icon: Briefcase,
  colorTheme: 'blue',
  backUrl: '/assets',
  apiEndpoint: '/api/assets',
  successUrl: '/assets',
  pageTitle: 'Create Asset',
  pageDescription: 'List an asset you own. You can use it later as collateral for loans.',
  formTitle: 'Asset Details',
  formDescription: 'Provide accurate, concise information. Do not include sensitive personal data.',
  fieldGroups,
  validationSchema: assetSchema,
  defaultValues,
  guidanceContent: assetGuidanceContent,
  defaultGuidance: assetDefaultGuidance,
  infoBanner: {
    title: 'Important Disclaimer',
    content:
      'OrangeCat does not verify the accuracy of asset information. You are solely responsible for your listings and any agreements you enter.',
    variant: 'warning',
  },
}

