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
  [key: string]: any; // Allow additional properties
}

/**
 * Entity configuration for type-safe entity rendering
 */
export interface EntityConfig<T extends BaseEntity = BaseEntity> {
  // Display configuration
  name: string;
  namePlural: string;
  icon?: React.ComponentType<{ className?: string }>;
  colorTheme?: 'orange' | 'blue' | 'green' | 'purple' | 'tiffany';

  // Routing
  listPath: string;
  detailPath: (id: string) => string;
  createPath: string;
  editPath: (id: string) => string;

  // API
  apiEndpoint: string;

  // Card configuration
  makeCardProps: (item: T, userCurrency?: string) => Omit<EntityCardProps, 'id' | 'title' | 'description' | 'thumbnailUrl' | 'href'>;
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

