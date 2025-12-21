/**
 * Entity Registry - Single Source of Truth
 *
 * Central registry for all entity types in the application.
 * Provides:
 * - Type-safe entity type definitions
 * - Centralized routing and navigation
 * - Entity metadata (icons, colors, labels)
 * - Easy addition of new entity types
 *
 * BENEFITS:
 * - Add new entity types in ONE place
 * - Type-safe entity type checking
 * - Consistent navigation patterns
 * - Reduces magic strings throughout codebase
 *
 * Created: 2025-12-16
 * Last Modified: 2025-12-16
 * Last Modified Summary: Initial entity registry implementation
 */

import { LucideIcon, Package, Briefcase, Heart, Coins, Users, FolderKanban, Wallet, Building2, Building } from 'lucide-react';

// ==================== ENTITY TYPES ====================

/**
 * All supported entity types - extend this when adding new entities
 */
export const ENTITY_TYPES = [
  'product',
  'service',
  'cause',
  'loan',
  'circle',
  'project',
  'wallet',
  'asset',
  'organization',
] as const;

export type EntityType = typeof ENTITY_TYPES[number];

// ==================== ENTITY METADATA ====================

export interface EntityMetadata {
  /** Entity type identifier */
  type: EntityType;
  /** Display name (singular) */
  name: string;
  /** Display name (plural) */
  namePlural: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Color theme */
  colorTheme: 'orange' | 'tiffany' | 'rose' | 'blue' | 'green' | 'purple';
  /** Base URL path */
  basePath: string;
  /** Create page URL */
  createPath: string;
  /** API endpoint */
  apiEndpoint: string;
  /** Whether this entity type supports templates */
  hasTemplates: boolean;
  /** Short description */
  description: string;
}

/**
 * Entity metadata registry - add new entities here
 */
export const ENTITY_REGISTRY: Record<EntityType, EntityMetadata> = {
  product: {
    type: 'product',
    name: 'Product',
    namePlural: 'Products',
    icon: Package,
    colorTheme: 'orange',
    basePath: '/dashboard/store',
    createPath: '/dashboard/store/create',
    apiEndpoint: '/api/products',
    hasTemplates: true,
    description: 'Physical or digital products for sale',
  },
  service: {
    type: 'service',
    name: 'Service',
    namePlural: 'Services',
    icon: Briefcase,
    colorTheme: 'tiffany',
    basePath: '/dashboard/services',
    createPath: '/dashboard/services/create',
    apiEndpoint: '/api/services',
    hasTemplates: true,
    description: 'Professional services you offer',
  },
  cause: {
    type: 'cause',
    name: 'Cause',
    namePlural: 'Causes',
    icon: Heart,
    colorTheme: 'rose',
    basePath: '/dashboard/causes',
    createPath: '/dashboard/causes/create',
    apiEndpoint: '/api/causes',
    hasTemplates: false,
    description: 'Charitable causes to support',
  },
  loan: {
    type: 'loan',
    name: 'Loan',
    namePlural: 'Loans',
    icon: Coins,
    colorTheme: 'purple',
    basePath: '/loans',
    createPath: '/loans/create',
    apiEndpoint: '/api/loans',
    hasTemplates: false,
    description: 'Peer-to-peer Bitcoin loans',
  },
  circle: {
    type: 'circle',
    name: 'Circle',
    namePlural: 'Circles',
    icon: Users,
    colorTheme: 'tiffany',
    basePath: '/circles',
    createPath: '/circles/create',
    apiEndpoint: '/api/circles',
    hasTemplates: false,
    description: 'Trust-based community circles',
  },
  project: {
    type: 'project',
    name: 'Project',
    namePlural: 'Projects',
    icon: FolderKanban,
    colorTheme: 'orange',
    basePath: '/projects',
    createPath: '/projects/create',
    apiEndpoint: '/api/projects',
    hasTemplates: true,
    description: 'Crowdfunded initiatives',
  },
  wallet: {
    type: 'wallet',
    name: 'Wallet',
    namePlural: 'Wallets',
    icon: Wallet,
    colorTheme: 'orange',
    basePath: '/dashboard/wallets',
    createPath: '/dashboard/wallets/add',
    apiEndpoint: '/api/wallets',
    hasTemplates: false,
    description: 'Bitcoin wallet connections',
  },
  asset: {
    type: 'asset',
    name: 'Asset',
    namePlural: 'Assets',
    icon: Building,
    colorTheme: 'blue',
    basePath: '/assets',
    createPath: '/assets/create',
    apiEndpoint: '/api/assets',
    hasTemplates: true,
    description: 'Valuable assets for collateral',
  },
  organization: {
    type: 'organization',
    name: 'Organization',
    namePlural: 'Organizations',
    icon: Building2,
    colorTheme: 'green',
    basePath: '/organizations',
    createPath: '/organizations/create',
    apiEndpoint: '/api/organizations',
    hasTemplates: false,
    description: 'Bitcoin-powered organizations',
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get entity metadata by type
 */
export function getEntityMetadata(type: EntityType): EntityMetadata {
  return ENTITY_REGISTRY[type];
}

/**
 * Get all entity types that support templates
 */
export function getEntitiesWithTemplates(): EntityType[] {
  return ENTITY_TYPES.filter(type => ENTITY_REGISTRY[type].hasTemplates);
}

/**
 * Check if a string is a valid entity type
 */
export function isValidEntityType(type: string): type is EntityType {
  return ENTITY_TYPES.includes(type as EntityType);
}

/**
 * Get create page URL for an entity type
 */
export function getCreateUrl(type: EntityType): string {
  return ENTITY_REGISTRY[type].createPath;
}

/**
 * Get entity list URL for an entity type
 */
export function getListUrl(type: EntityType): string {
  return ENTITY_REGISTRY[type].basePath;
}

/**
 * Get API endpoint for an entity type
 */
export function getApiEndpoint(type: EntityType): string {
  return ENTITY_REGISTRY[type].apiEndpoint;
}

// ==================== EXPORTS ====================

export default ENTITY_REGISTRY;
