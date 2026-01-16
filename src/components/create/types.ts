/**
 * UNIFIED ENTITY CREATION SYSTEM - Types
 *
 * Shared type definitions for the modular entity creation system.
 * Enables consistent form building across products, services, causes, etc.
 *
 * SINGLE SOURCE OF TRUTH for:
 * - Field configuration types
 * - Entity configuration types
 * - Template types
 * - Guidance types
 * - Form state types
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-16
 * Last Modified Summary: Added unified template types and improved documentation
 */

import { ReactNode, ComponentType } from 'react';
import { LucideIcon } from 'lucide-react';
import { ZodType, ZodTypeDef } from 'zod';

// ==================== FIELD TYPES ====================

export type FieldInputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'boolean'
  | 'date'
  | 'url'
  | 'email'
  | 'phone'
  | 'currency'
  | 'bitcoin_address'
  | 'tags';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface FieldConfig {
  /** Unique field identifier */
  name: string;
  /** Display label */
  label: string;
  /** Input type */
  type: FieldInputType;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Options for select/radio fields */
  options?: SelectOption[];
  /** Hint text shown below field */
  hint?: string;
  /** Min value for number fields */
  min?: number;
  /** Max value for number fields */
  max?: number;
  /** Step value for number fields */
  step?: number;
  /** Number of rows for textarea */
  rows?: number;
  /** Conditional visibility based on other fields */
  showWhen?: {
    field: string;
    value: string | string[] | boolean;
  };
  /** Field depends on another field's value */
  dependsOn?: string | {
    field: string;
    value?: string | string[] | boolean;
  };
  /** Default value for the field */
  defaultValue?: unknown;
  /** Field grouping */
  group?: string;
  /** Column span (1 or 2 for grid layout) */
  colSpan?: 1 | 2;
}

export interface FieldGroup {
  /** Group identifier */
  id: string;
  /** Group title */
  title: string;
  /** Group description */
  description?: string;
  /** Fields in this group */
  fields?: FieldConfig[];
  /** Custom component to render instead of fields (for complex components like collateral) */
  customComponent?: ComponentType<{
    formData: Record<string, unknown>;
    onFieldChange: (field: string, value: unknown) => void;
    disabled?: boolean;
  }>;
  /** Conditional display based on another field's value */
  conditionalOn?: {
    field: string;
    value: string | string[];
  };
}

// ==================== GUIDANCE TYPES ====================

export interface GuidanceContent {
  /** Icon component */
  icon: ReactNode;
  /** Field title */
  title: string;
  /** Main description */
  description: string;
  /** Best practice tips */
  tips: string[];
  /** Example values */
  examples?: string[];
}

export interface DefaultGuidance {
  /** Default panel title */
  title: string;
  /** Default description */
  description: string;
  /** Feature highlights */
  features: Array<{
    icon: ReactNode;
    text: string;
  }>;
  /** Hint text */
  hint?: string;
}

// ==================== ENTITY CONFIGURATION ====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EntityConfig<T extends Record<string, any> = Record<string, any>> {
  /** Entity type identifier */
  type: 'product' | 'service' | 'cause' | 'loan' | 'circle' | 'project' | 'asset' | 'organization' | 'ai_assistant' | 'event' | 'group' | 'wishlist' | 'research';
  /** Display name (singular) */
  name: string;
  /** Display name (plural) */
  namePlural: string;
  /** Entity icon */
  icon: LucideIcon;
  /** Primary color theme */
  colorTheme: 'orange' | 'tiffany' | 'rose' | 'blue' | 'green' | 'purple';
  /** Back link URL */
  backUrl: string;
  /** API endpoint for CRUD */
  apiEndpoint: string;
  /** Success redirect URL (use [field] placeholders, e.g., /products/[id]) */
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
  /** Zod validation schema - uses ZodType for flexibility with defaults/transforms */
  validationSchema: ZodType<T, ZodTypeDef, unknown>;
  /** Default form values */
  defaultValues: T;
  /** Field-specific guidance content */
  guidanceContent: Record<string, GuidanceContent>;
  /** Default guidance when no field selected */
  defaultGuidance: DefaultGuidance;
  /** Optional info banner */
  infoBanner?: {
    title: string;
    content: string;
    variant: 'info' | 'warning' | 'success';
  };
  /** Optional templates for quick-start */
  templates?: EntityTemplate<T>[] | unknown[];
  /** Optional success message after creation */
  successMessage?: string;
  /** Optional delay before redirecting after success (ms) */
  successRedirectDelay?: number;
}

// ==================== FORM STATE ====================

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  activeField: string | null;
}

export interface FormActions<T> {
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
  setActiveField: (field: string | null) => void;
  submit: () => Promise<void>;
  reset: () => void;
}

// ==================== COMPONENT PROPS ====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EntityFormProps<T extends Record<string, any>> {
  config: EntityConfig<T>;
  initialValues?: Partial<T>;
  onSuccess?: (data: T & { id: string }) => void;
  onError?: (error: string) => void;
  mode?: 'create' | 'edit';
  entityId?: string;
}

export interface FormFieldProps {
  config: FieldConfig;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  onFocus: () => void;
  /** Optional callback when currency changes (for currency input fields) */
  onCurrencyChange?: (currency: string) => void;
  /** Current currency value (for currency input fields) */
  currency?: string;
  disabled?: boolean;
}

export interface GuidancePanelProps {
  activeField: string | null;
  guidanceContent: Record<string, GuidanceContent>;
  defaultGuidance: DefaultGuidance;
  /** Optional additional content (e.g., currency converter) */
  additionalContent?: ReactNode;
}

// ==================== TEMPLATE TYPES ====================

/**
 * Unified template interface - SINGLE SOURCE OF TRUTH
 *
 * All entity templates (Products, Services, Assets, Projects, etc.)
 * must conform to this interface for consistency.
 *
 * Note: Use `defaults` (not `data`) to store the prefill values.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EntityTemplate<T extends Record<string, any> = Record<string, any>> {
  /** Unique identifier for the template */
  id: string;
  /** Icon to display (ReactNode, typically a Lucide icon) */
  icon: ReactNode;
  /** Display name for the template */
  name: string;
  /** Short description/tagline */
  tagline: string;
  /** Category for grouping templates (optional) */
  category?: string;
  /** Default values to prefill the form with */
  defaults: Partial<T>;
}

/**
 * Props for template picker/selector components
 */
export interface TemplatePickerProps<T extends EntityTemplate> {
  /** Label to display (e.g., "Products", "Services") */
  label: string;
  /** Array of available templates */
  templates: T[];
  /** Callback when a template is selected */
  onSelectTemplate: (template: T) => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Return type for useTemplateSelection hook
 */
export interface UseTemplateSelectionReturn<T extends Record<string, unknown>> {
  /** Current template values (empty object if none selected) */
  templateValues: Partial<T>;
  /** Config with merged default values */
  mergedConfig: EntityConfig<T>;
  /** Handler to call when template is selected */
  handleSelectTemplate: (template: EntityTemplate<T>) => void;
  /** Reset template selection */
  resetTemplate: () => void;
  /** Whether a template has been selected */
  hasTemplateSelected: boolean;
}



