/**
 * PRODUCT ENTITY CONFIGURATION
 *
 * Defines the form structure, validation, and guidance for product creation.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 */

import { Package } from 'lucide-react';
import { userProductSchema, type UserProductFormData } from '@/lib/validation';
import {
  productGuidanceContent,
  productDefaultGuidance,
} from '@/lib/entity-guidance/product-guidance';
import type { EntityConfig, FieldGroup } from '@/components/create/types';
import { PRODUCT_TEMPLATES, type ProductTemplate } from '@/components/create/templates';

// ==================== FIELD GROUPS ====================

const fieldGroups: FieldGroup[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Essential details about your product',
    fields: [
      {
        name: 'title',
        label: 'Product Title',
        type: 'text',
        placeholder: 'e.g., Handmade Coffee Mug - 12oz Blue',
        required: true,
        colSpan: 2,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Describe your product in detail...',
        rows: 4,
        colSpan: 2,
      },
      {
        name: 'category',
        label: 'Category',
        type: 'text',
        placeholder: 'e.g., Handmade, Digital, Food',
      },
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        options: [
          { value: 'physical', label: 'Physical Product' },
          { value: 'digital', label: 'Digital Product' },
          { value: 'service', label: 'Service' },
        ],
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing',
    description: 'Set your product price (enter in your preferred currency)',
    fields: [
      {
        name: 'price_sats',
        label: 'Price',
        type: 'currency',
        placeholder: '50.00',
        required: true,
        min: 1,
        hint: 'Enter in your preferred currency. All payments are in Bitcoin.',
        colSpan: 2,
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory & Fulfillment',
    description: 'Manage stock and delivery',
    fields: [
      {
        name: 'inventory_count',
        label: 'Inventory Count',
        type: 'number',
        placeholder: '-1 for unlimited',
        min: -1,
        hint: 'Use -1 for unlimited stock',
      },
      {
        name: 'fulfillment_type',
        label: 'Fulfillment Type',
        type: 'select',
        options: [
          { value: 'manual', label: 'Manual' },
          { value: 'automatic', label: 'Automatic' },
          { value: 'digital', label: 'Digital Delivery' },
        ],
      },
    ],
  },
];

// ==================== DEFAULT VALUES ====================

const defaultValues: UserProductFormData = {
  title: '',
  description: '',
  price_sats: 0,
  currency: 'SATS',
  product_type: 'physical',
  images: [],
  thumbnail_url: '',
  inventory_count: -1,
  fulfillment_type: 'manual',
  category: '',
  tags: [],
  status: 'draft',
  is_featured: false,
};

// ==================== EXPORT CONFIG ====================

export const productConfig: EntityConfig<UserProductFormData> = {
  type: 'product',
  name: 'Product',
  namePlural: 'Products',
  icon: Package,
  colorTheme: 'orange',
  backUrl: '/dashboard/store',
  apiEndpoint: '/api/products',
  successUrl: '/dashboard/store',
  pageTitle: 'Create Product',
  pageDescription: 'Add a new product to your personal marketplace',
  formTitle: 'Product Details',
  formDescription:
    'Fill in the information for your new product. You can always edit these details later.',
  fieldGroups,
  validationSchema: userProductSchema,
  defaultValues,
  guidanceContent: productGuidanceContent as any,
  defaultGuidance: productDefaultGuidance,
  templates: PRODUCT_TEMPLATES as unknown as ProductTemplate[],
};
