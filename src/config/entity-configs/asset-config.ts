import { Briefcase } from 'lucide-react';
import type { FieldGroup } from '@/components/create/types';
import { assetGuidanceContent, assetDefaultGuidance } from '@/lib/entity-guidance/asset-guidance';
import { currencySelectOptions, DEFAULT_CURRENCY } from '@/config/currencies';
import { assetSchema, type AssetFormData } from '@/lib/validation';
import { ASSET_TEMPLATES, type AssetTemplate } from '@/components/create/templates';
import { createEntityConfig } from './base-config-factory';

const fieldGroups: FieldGroup[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Essential details about your asset',
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        colSpan: 2,
        placeholder: 'e.g., 123 Main St Apartment',
      },
      {
        name: 'type',
        label: 'Asset Type',
        type: 'select',
        required: true,
        options: [
          { value: 'real_estate', label: 'Real Estate' },
          { value: 'vehicle', label: 'Vehicle' },
          { value: 'luxury', label: 'Luxury Item' },
          { value: 'equipment', label: 'Equipment' },
          { value: 'computing', label: 'Computing' },
          { value: 'recreational', label: 'Recreational' },
          { value: 'robot', label: 'Robot / Automation' },
          { value: 'drone', label: 'Drone / UAV' },
          { value: 'business', label: 'Business' },
          { value: 'securities', label: 'Securities' },
          { value: 'other', label: 'Other' },
        ],
        colSpan: 2,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        placeholder: 'Describe the asset (avoid sensitive details)...',
      },
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
  {
    id: 'sale',
    title: 'Sale Options',
    description: 'List this asset for sale',
    fields: [
      {
        name: 'is_for_sale',
        label: 'Available for Sale',
        type: 'checkbox',
        hint: 'Enable if you want to sell this asset',
        colSpan: 2,
      },
      { name: 'sale_price_sats', label: 'Sale Price', type: 'number', min: 1, colSpan: 2 },
    ],
  },
  {
    id: 'rental',
    title: 'Rental Options',
    description: 'List this asset for rent',
    fields: [
      {
        name: 'is_for_rent',
        label: 'Available for Rent',
        type: 'checkbox',
        hint: 'Enable if you want to rent out this asset',
        colSpan: 2,
      },
      { name: 'rental_price_sats', label: 'Rental Price', type: 'number', min: 1 },
      {
        name: 'rental_period_type',
        label: 'Rental Period',
        type: 'select',
        options: [
          { value: 'hourly', label: 'Per Hour' },
          { value: 'daily', label: 'Per Day' },
          { value: 'weekly', label: 'Per Week' },
          { value: 'monthly', label: 'Per Month' },
        ],
      },
      { name: 'min_rental_period', label: 'Minimum Rental Period', type: 'number', min: 1 },
      { name: 'max_rental_period', label: 'Maximum Rental Period', type: 'number', min: 1 },
    ],
  },
  {
    id: 'deposit',
    title: 'Deposit',
    description: 'Require a security deposit for rentals',
    fields: [
      {
        name: 'requires_deposit',
        label: 'Require Deposit',
        type: 'checkbox',
        hint: 'Require a security deposit before rental',
        colSpan: 2,
      },
      {
        name: 'deposit_amount_sats',
        label: 'Deposit Amount (sats)',
        type: 'number',
        min: 1,
        colSpan: 2,
      },
    ],
  },
  {
    id: 'visibility',
    title: 'Profile Visibility',
    description: 'Control where this asset appears',
    fields: [
      {
        name: 'show_on_profile',
        label: 'Show on Public Profile',
        type: 'checkbox',
        hint: 'When enabled, this asset will appear on your public profile page',
        colSpan: 2,
      },
    ],
  },
];

const defaultValues: AssetFormData = {
  title: '',
  type: 'other',
  description: '',
  location: '',
  estimated_value: undefined,
  currency: DEFAULT_CURRENCY,
  documents: [],
  is_for_sale: false,
  sale_price_sats: undefined,
  is_for_rent: false,
  rental_price_sats: undefined,
  rental_period_type: 'daily',
  min_rental_period: 1,
  max_rental_period: undefined,
  requires_deposit: false,
  deposit_amount_sats: undefined,
  show_on_profile: true,
};

export const assetConfig = createEntityConfig<AssetFormData>({
  entityType: 'asset',
  name: 'Asset',
  namePlural: 'Assets',
  icon: Briefcase,
  colorTheme: 'blue',
  backUrl: '/assets',
  successUrl: '/assets/[id]',
  pageTitle: 'Create Asset',
  pageDescription: 'List an asset you own. You can use it later as collateral for loans.',
  formTitle: 'Asset Details',
  formDescription: 'Provide accurate, concise information. Do not include sensitive personal data.',
  fieldGroups,
  validationSchema: assetSchema,
  defaultValues,
  guidanceContent: assetGuidanceContent,
  defaultGuidance: assetDefaultGuidance,
  templates: ASSET_TEMPLATES as unknown as AssetTemplate[],
  infoBanner: {
    title: 'Important Disclaimer',
    content:
      'OrangeCat does not verify the accuracy of asset information. You are solely responsible for your listings and any agreements you enter.',
    variant: 'warning',
  },
});
