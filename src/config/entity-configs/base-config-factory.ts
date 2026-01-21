/**
 * Base Entity Config Factory
 *
 * Reduces boilerplate in entity config files by providing common structure
 * and helper functions for field patterns.
 *
 * Created: 2025-12-27
 * Last Modified: 2025-12-27
 * Last Modified Summary: Base factory to reduce entity config boilerplate
 */

import type { LucideIcon } from 'lucide-react';
import type {
  EntityConfig,
  FieldGroup,
  FieldConfig,
  GuidanceContent,
} from '@/components/create/types';
import type { ZodType } from 'zod';
import { getEntityMetadata, type EntityType } from '@/config/entity-registry';

/**
 * Common field definitions that appear in most entity forms
 */
export const commonFields = {
  title: (options?: {
    label?: string;
    placeholder?: string;
    required?: boolean;
    colSpan?: 1 | 2;
  }): FieldConfig => ({
    name: 'title',
    label: options?.label ?? 'Title',
    type: 'text',
    placeholder: options?.placeholder ?? 'Enter a title...',
    required: options?.required ?? true,
    colSpan: (options?.colSpan ?? 2) as 1 | 2,
  }),

  description: (options?: {
    label?: string;
    placeholder?: string;
    rows?: number;
    required?: boolean;
    colSpan?: 1 | 2;
    hint?: string;
  }): FieldConfig => ({
    name: 'description',
    label: options?.label ?? 'Description',
    type: 'textarea',
    placeholder: options?.placeholder ?? 'Describe in detail...',
    rows: options?.rows ?? 4,
    required: options?.required ?? false,
    colSpan: (options?.colSpan ?? 2) as 1 | 2,
    hint: options?.hint,
  }),

  category: (options?: {
    label?: string;
    placeholder?: string;
    required?: boolean;
    colSpan?: 1 | 2;
  }): FieldConfig => ({
    name: 'category',
    label: options?.label ?? 'Category',
    type: 'text',
    placeholder: options?.placeholder ?? 'e.g., Category name',
    required: options?.required ?? false,
    colSpan: (options?.colSpan ?? 1) as 1 | 2,
  }),
};

/**
 * Create a basic field group with title and description
 */
export function createBasicInfoGroup(entityName: string, fields: FieldConfig[] = []): FieldGroup {
  return {
    id: 'basic',
    title: 'Basic Information',
    description: `Essential details about your ${entityName.toLowerCase()}`,
    fields: [
      commonFields.title({ label: `${entityName} Title` }),
      commonFields.description({ label: 'Description' }),
      ...fields,
    ],
  };
}

/**
 * Base config factory options
 */
export interface BaseConfigOptions<T extends Record<string, any>> {
  /** Entity type from registry (excluding wallet) */
  entityType: Exclude<EntityType, 'wallet'>;
  /** Display name (singular) */
  name: string;
  /** Display name (plural) */
  namePlural: string;
  /** Entity icon */
  icon: LucideIcon;
  /** Primary color theme */
  colorTheme: 'orange' | 'tiffany' | 'rose' | 'blue' | 'green' | 'purple' | 'indigo';
  /** Back link URL */
  backUrl: string;
  /** Success redirect URL */
  successUrl: string;
  /** Page title */
  pageTitle: string;
  /** Page description */
  pageDescription: string;
  /** Form title */
  formTitle: string;
  /** Form description */
  formDescription: string;
  /** Field groups */
  fieldGroups: FieldGroup[];
  /** Zod validation schema */
  validationSchema: ZodType<T, any, unknown>;
  /** Default form values */
  defaultValues: T;
  /** Field-specific guidance content */
  guidanceContent: Record<string, GuidanceContent>;
  /** Default guidance when no field selected */
  defaultGuidance: {
    title: string;
    description: string;
    features: Array<{
      icon: React.ReactNode;
      text: string;
    }>;
    hint?: string;
  };
  /** Optional templates */
  templates?: any[];
  /** Optional info banner */
  infoBanner?: {
    title: string;
    content: string;
    variant: 'info' | 'warning' | 'success';
  };
  /** Optional success message */
  successMessage?: string;
  /** Optional redirect delay */
  successRedirectDelay?: number;
}

/**
 * Create entity config with common structure
 *
 * This factory reduces boilerplate by:
 * - Deriving API endpoint from entity registry
 * - Ensuring consistent structure
 * - Type safety
 *
 * @example
 * ```typescript
 * export const productConfig = createEntityConfig({
 *   entityType: 'product',
 *   name: 'Product',
 *   namePlural: 'Products',
 *   icon: Package,
 *   colorTheme: 'orange',
 *   backUrl: '/dashboard/store',
 *   successUrl: '/dashboard/store',
 *   pageTitle: 'Create Product',
 *   // ... rest of config
 * });
 * ```
 */
export function createEntityConfig<T extends Record<string, any>>(
  options: BaseConfigOptions<T>
): EntityConfig<T> {
  const meta = getEntityMetadata(options.entityType);

  return {
    type: options.entityType,
    name: options.name,
    namePlural: options.namePlural,
    icon: options.icon,
    colorTheme: options.colorTheme,
    backUrl: options.backUrl,
    apiEndpoint: meta.apiEndpoint, // Use registry as SSOT
    successUrl: options.successUrl,
    pageTitle: options.pageTitle,
    pageDescription: options.pageDescription,
    formTitle: options.formTitle,
    formDescription: options.formDescription,
    fieldGroups: options.fieldGroups,
    validationSchema: options.validationSchema,
    defaultValues: options.defaultValues,
    guidanceContent: options.guidanceContent,
    defaultGuidance: options.defaultGuidance,
    templates: options.templates,
    infoBanner: options.infoBanner,
    successMessage: options.successMessage,
    successRedirectDelay: options.successRedirectDelay,
  };
}
