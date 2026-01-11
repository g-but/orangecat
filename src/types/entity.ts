/**
 * Entity Types - Type definitions for modular entity system
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Initial creation of entity type definitions
 */

import { ReactNode } from 'react';
import { EntityCardProps } from '@/components/entity/EntityCard';

/**
 * Base entity interface - all entities must have these fields
 */
export interface BaseEntity {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Entity configuration for type-safe entity rendering
 */
export interface EntityConfig<T extends BaseEntity = BaseEntity> {
  // Identity
  entityType?: string;
  displayName?: string;
  displayNamePlural?: string;

  // Display configuration
  name: string;
  namePlural: string;
  icon?: React.ComponentType<{ className?: string }> | string;
  colorTheme?: 'orange' | 'blue' | 'green' | 'purple' | 'tiffany';
  color?: string;
  description?: string;

  // Routing
  listPath: string;
  detailPath: (id: string) => string;
  createPath: string;
  editPath: (id: string) => string;

  // API
  apiEndpoint: string;

  // Validation schema (Zod)
  schema?: unknown;

  // Field definitions
  fields?: Array<{
    name: string;
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    maxLength?: number;
    min?: number;
    max?: number;
    options?: Array<{ value: string; label: string }>;
    hint?: string;
    arrayType?: string;
    arrayFields?: Array<{
      name: string;
      label: string;
      type: string;
      required?: boolean;
      min?: number;
      max?: number;
    }>;
  }>;

  // Section definitions for complex forms
  sections?: Array<{
    id: string;
    title: string;
    description?: string;
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required?: boolean;
      placeholder?: string;
      maxLength?: number;
      min?: number;
      max?: number;
      options?: Array<{ value: string; label: string }>;
      hint?: string;
      arrayType?: string;
      arrayFields?: Array<{
        name: string;
        label: string;
        type: string;
        required?: boolean;
        min?: number;
        max?: number;
      }>;
    }>;
  }>;

  // Default values for new entities
  defaults?: Partial<T>;

  // Validation rules
  validation?: {
    custom?: Array<{
      field: string;
      rule: (value: unknown) => boolean;
      message: string;
    }>;
  };

  // Permissions
  permissions?: {
    create?: 'authenticated' | 'public' | 'admin';
    read?: 'authenticated' | 'public' | 'admin' | 'owner';
    update?: 'owner' | 'admin';
    delete?: 'owner' | 'admin';
  };

  // Card configuration
  makeCardProps: (
    item: T,
    userCurrency?: string
  ) => Omit<EntityCardProps, 'id' | 'title' | 'description' | 'thumbnailUrl' | 'href'>;
  makeHref: (item: T) => string;

  // Empty state
  emptyState?: {
    title: string;
    description?: string;
    action?: ReactNode;
  };

  // List configuration
  gridCols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}
