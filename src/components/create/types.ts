/**
 * UNIFIED ENTITY CREATION SYSTEM - Types
 *
 * Shared type definitions for the modular entity creation system.
 * Enables consistent form building across products, services, causes, etc.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 * Last Modified Summary: Initial type definitions for unified creation system
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { ZodSchema } from 'zod';

// ==================== FIELD TYPES ====================

export type FieldInputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
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
  /** Number of rows for textarea */
  rows?: number;
  /** Conditional visibility based on other fields */
  showWhen?: {
    field: string;
    value: string | string[] | boolean;
  };
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
  fields: FieldConfig[];
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

export interface EntityConfig<T extends Record<string, any> = Record<string, any>> {
  /** Entity type identifier */
  type: 'product' | 'service' | 'cause' | 'loan' | 'circle' | 'project' | 'wallet' | 'asset';
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
  /** Success redirect URL (can include :id placeholder) */
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
  validationSchema: ZodSchema<T>;
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
  setFieldValue: (field: keyof T, value: any) => void;
  setActiveField: (field: string | null) => void;
  submit: () => Promise<void>;
  reset: () => void;
}

// ==================== COMPONENT PROPS ====================

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
  value: any;
  error?: string;
  onChange: (value: any) => void;
  onFocus: () => void;
  disabled?: boolean;
}

export interface GuidancePanelProps {
  activeField: string | null;
  guidanceContent: Record<string, GuidanceContent>;
  defaultGuidance: DefaultGuidance;
  /** Optional additional content (e.g., currency converter) */
  additionalContent?: ReactNode;
}



