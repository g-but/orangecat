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
 * Last Modified: 2025-12-24
 * Last Modified Summary: Added category, priority, createActionLabel fields; fixed wallet path; added color mapping for Tailwind
 */

import {
  LucideIcon,
  Package,
  Briefcase,
  Heart,
  Coins,
  Users,
  Rocket,
  Wallet,
  Building,
  Bot,
  Calendar,
  Gift,
  FileText,
} from 'lucide-react';

// ==================== ENTITY TYPES ====================

/**
 * All supported entity types - extend this when adding new entities
 */
export const ENTITY_TYPES = [
  'wallet',
  'project',
  'product',
  'service',
  'cause',
  'ai_assistant',
  'group',
  'asset',
  'loan',
  'event',
  'research',
  'wishlist',
  'document',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

// ==================== ENTITY CATEGORIES ====================

/**
 * Entity categories for grouping in UI
 */
export type EntityCategory = 'gateway' | 'business' | 'community' | 'finance' | 'personal';

export const ENTITY_CATEGORY_ORDER: EntityCategory[] = [
  'gateway',
  'business',
  'community',
  'finance',
  'personal',
];

// ==================== ENTITY METADATA ====================

export interface EntityMetadata {
  /** Entity type identifier */
  type: EntityType;
  /** Display name (singular) */
  name: string;
  /** Display name (plural) */
  namePlural: string;
  /** Database table name */
  tableName: string;
  /** Column name for user/owner ID (used for RLS queries) */
  userIdField: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Color theme */
  colorTheme: 'orange' | 'tiffany' | 'rose' | 'blue' | 'green' | 'purple' | 'indigo';
  /** Base URL path (dashboard) */
  basePath: string;
  /** Create page URL */
  createPath: string;
  /** Public view base path (e.g., /products, /services) - append /{id} for detail view */
  publicBasePath: string;
  /** API endpoint */
  apiEndpoint: string;
  /** Whether this entity type supports templates */
  hasTemplates: boolean;
  /** Short description (for listings) */
  description: string;
  /** Action-oriented label for create menu */
  createActionLabel: string;
  /** Category for grouping in create menu */
  category: EntityCategory;
  /** Priority within category (lower = higher priority) */
  createPriority: number;
}

/**
 * Entity metadata registry - add new entities here
 *
 * SINGLE SOURCE OF TRUTH for all entity types.
 * SmartCreateButton and other UI components derive their options from this registry.
 */
export const ENTITY_REGISTRY: Record<EntityType, EntityMetadata> = {
  // ==================== GATEWAY (Foundational) ====================
  wallet: {
    type: 'wallet',
    name: 'Wallet',
    namePlural: 'Wallets',
    tableName: 'wallets',
    userIdField: 'profile_id',
    icon: Wallet,
    colorTheme: 'orange',
    basePath: '/dashboard/wallets',
    createPath: '/dashboard/wallets',
    publicBasePath: '/wallets',
    apiEndpoint: '/api/wallets',
    hasTemplates: false,
    description: 'Bitcoin wallet connections',
    createActionLabel: 'Connect a Bitcoin wallet',
    category: 'gateway',
    createPriority: 1,
  },

  // ==================== BUSINESS (Core value creation) ====================
  project: {
    type: 'project',
    name: 'Project',
    namePlural: 'Projects',
    tableName: 'projects',
    userIdField: 'user_id',
    icon: Rocket,
    colorTheme: 'orange',
    basePath: '/dashboard/projects',
    createPath: '/dashboard/projects/create',
    publicBasePath: '/projects',
    apiEndpoint: '/api/projects',
    hasTemplates: true,
    description: 'Crowdfunded initiatives',
    createActionLabel: 'Launch a crowdfunding campaign',
    category: 'business',
    createPriority: 1,
  },
  product: {
    type: 'product',
    name: 'Product',
    namePlural: 'Products',
    tableName: 'user_products',
    userIdField: 'user_id',
    icon: Package,
    colorTheme: 'blue',
    basePath: '/dashboard/store',
    createPath: '/dashboard/store/create',
    publicBasePath: '/products',
    apiEndpoint: '/api/products',
    hasTemplates: true,
    description: 'Physical or digital products for sale',
    createActionLabel: 'Sell goods in your store',
    category: 'business',
    createPriority: 2,
  },
  service: {
    type: 'service',
    name: 'Service',
    namePlural: 'Services',
    tableName: 'user_services',
    userIdField: 'user_id',
    icon: Briefcase,
    colorTheme: 'tiffany',
    basePath: '/dashboard/services',
    createPath: '/dashboard/services/create',
    publicBasePath: '/services',
    apiEndpoint: '/api/services',
    hasTemplates: true,
    description: 'Professional services you offer',
    createActionLabel: 'Offer your expertise',
    category: 'business',
    createPriority: 3,
  },
  cause: {
    type: 'cause',
    name: 'Cause',
    namePlural: 'Causes',
    tableName: 'user_causes',
    userIdField: 'user_id',
    icon: Heart,
    colorTheme: 'rose',
    basePath: '/dashboard/causes',
    createPath: '/dashboard/causes/create',
    publicBasePath: '/causes',
    apiEndpoint: '/api/causes',
    hasTemplates: false,
    description: 'Charitable causes to support',
    createActionLabel: 'Support a meaningful cause',
    category: 'business',
    createPriority: 4,
  },
  ai_assistant: {
    type: 'ai_assistant',
    name: 'AI Assistant',
    namePlural: 'AI Assistants',
    tableName: 'ai_assistants',
    userIdField: 'user_id',
    icon: Bot,
    colorTheme: 'purple',
    basePath: '/dashboard/ai-assistants',
    createPath: '/dashboard/ai-assistants/create',
    publicBasePath: '/ai-assistants',
    apiEndpoint: '/api/ai-assistants',
    hasTemplates: true,
    description: 'Autonomous AI services you create and monetize',
    createActionLabel: 'Build an AI assistant',
    category: 'business',
    createPriority: 5,
  },

  // ==================== COMMUNITY (Network building) ====================
  group: {
    type: 'group',
    name: 'Group',
    namePlural: 'Groups',
    tableName: 'groups',
    userIdField: 'created_by',
    icon: Users,
    colorTheme: 'purple',
    basePath: '/dashboard/groups',
    createPath: '/dashboard/groups/create',
    publicBasePath: '/groups',
    apiEndpoint: '/api/groups',
    hasTemplates: false,
    description: 'Community groups and organizations',
    createActionLabel: 'Start a community group',
    category: 'community',
    createPriority: 1,
  },

  // ==================== FINANCE (P2P financial tools) ====================
  asset: {
    type: 'asset',
    name: 'Asset',
    namePlural: 'Assets',
    tableName: 'assets',
    userIdField: 'owner_id',
    icon: Building,
    colorTheme: 'green',
    basePath: '/dashboard/assets',
    createPath: '/dashboard/assets/create',
    publicBasePath: '/assets',
    apiEndpoint: '/api/assets',
    hasTemplates: true,
    description: 'Valuable assets for collateral',
    createActionLabel: 'List an asset for collateral',
    category: 'finance',
    createPriority: 1,
  },
  loan: {
    type: 'loan',
    name: 'Loan',
    namePlural: 'Loans',
    tableName: 'loans',
    userIdField: 'user_id',
    icon: Coins,
    colorTheme: 'tiffany',
    basePath: '/dashboard/loans',
    createPath: '/dashboard/loans/create',
    publicBasePath: '/loans',
    apiEndpoint: '/api/loans',
    hasTemplates: false,
    description: 'Peer-to-peer Bitcoin loans',
    createActionLabel: 'Request or offer a loan',
    category: 'finance',
    createPriority: 2,
  },
  event: {
    type: 'event',
    name: 'Event',
    namePlural: 'Events',
    tableName: 'events',
    userIdField: 'user_id',
    icon: Calendar,
    colorTheme: 'blue',
    basePath: '/dashboard/events',
    createPath: '/dashboard/events/create',
    publicBasePath: '/events',
    apiEndpoint: '/api/events',
    hasTemplates: true,
    description: 'In-person gatherings and meetups',
    createActionLabel: 'Organize an in-person event',
    category: 'community',
    createPriority: 3,
  },

  // ==================== RESEARCH (DeSci ecosystem) ====================
  research: {
    type: 'research',
    name: 'Research',
    namePlural: 'Research',
    tableName: 'research_entities', // Database table name (unchanged for compatibility)
    userIdField: 'user_id',
    icon: Bot,
    colorTheme: 'purple',
    basePath: '/dashboard/research',
    createPath: '/dashboard/research/create',
    publicBasePath: '/research',
    apiEndpoint: '/api/research',
    hasTemplates: true,
    description:
      'Independent research topics with decentralized funding (e.g., Dark Matter, Climate Science)',
    createActionLabel: 'Fund a research topic',
    category: 'business',
    createPriority: 6,
  },

  // ==================== PERSONAL (Wishlists & Registries) ====================
  wishlist: {
    type: 'wishlist',
    name: 'Wishlist',
    namePlural: 'Wishlists',
    tableName: 'wishlists',
    userIdField: 'actor_id',
    icon: Gift,
    colorTheme: 'rose',
    basePath: '/dashboard/wishlists',
    createPath: '/dashboard/wishlists/create',
    publicBasePath: '/wishlists',
    apiEndpoint: '/api/wishlists',
    hasTemplates: true,
    description: 'List items you want - others can buy them for you',
    createActionLabel: 'Create a wishlist',
    category: 'business',
    createPriority: 7,
  },

  // ==================== PERSONAL (My Cat Context) ====================
  document: {
    type: 'document',
    name: 'Document',
    namePlural: 'Documents',
    tableName: 'user_documents',
    userIdField: 'actor_id',
    icon: FileText,
    colorTheme: 'indigo',
    basePath: '/dashboard/documents',
    createPath: '/dashboard/documents/create',
    publicBasePath: '/documents',
    apiEndpoint: '/api/documents',
    hasTemplates: false,
    description: 'Personal context for My Cat - goals, skills, notes',
    createActionLabel: 'Add context for My Cat',
    category: 'personal',
    createPriority: 1,
  },
};

// ==================== COLOR MAPPING ====================

/**
 * Static color class mapping for Tailwind CSS
 * Tailwind purges dynamic classes, so we need literal strings
 */
export const COLOR_CLASSES: Record<EntityMetadata['colorTheme'], { text: string; bg: string }> = {
  orange: { text: 'text-orange-600', bg: 'bg-orange-50' },
  tiffany: { text: 'text-tiffany-600', bg: 'bg-tiffany-50' },
  rose: { text: 'text-rose-600', bg: 'bg-rose-50' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-50' },
  green: { text: 'text-green-600', bg: 'bg-green-50' },
  purple: { text: 'text-purple-600', bg: 'bg-purple-50' },
  indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50' },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get entity metadata by type
 */
export function getEntityMetadata(type: EntityType): EntityMetadata {
  return ENTITY_REGISTRY[type];
}

/**
 * Get color classes for an entity type
 */
export function getEntityColorClasses(type: EntityType): { text: string; bg: string } {
  const entity = ENTITY_REGISTRY[type];
  return COLOR_CLASSES[entity.colorTheme];
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

/**
 * Get database table name for an entity type
 */
export function getTableName(type: EntityType): string {
  return ENTITY_REGISTRY[type].tableName;
}

/**
 * Get user ID field name for an entity type (used for RLS queries)
 */
export function getUserIdField(type: EntityType): string {
  return ENTITY_REGISTRY[type].userIdField;
}

/**
 * Get entities sorted by category and priority for create menu
 * Returns entities in the order they should appear in the dropdown
 */
export function getEntitiesForCreateMenu(): EntityMetadata[] {
  return ENTITY_TYPES.map(type => ENTITY_REGISTRY[type]).sort((a, b) => {
    // First sort by category order
    const categoryOrderA = ENTITY_CATEGORY_ORDER.indexOf(a.category);
    const categoryOrderB = ENTITY_CATEGORY_ORDER.indexOf(b.category);
    if (categoryOrderA !== categoryOrderB) {
      return categoryOrderA - categoryOrderB;
    }
    // Then by priority within category
    return a.createPriority - b.createPriority;
  });
}

/**
 * Get entities grouped by category
 */
export function getEntitiesByCategory(): Record<EntityCategory, EntityMetadata[]> {
  const grouped: Record<EntityCategory, EntityMetadata[]> = {
    gateway: [],
    business: [],
    community: [],
    finance: [],
    personal: [],
  };

  ENTITY_TYPES.forEach(type => {
    const entity = ENTITY_REGISTRY[type];
    grouped[entity.category].push(entity);
  });

  // Sort each category by priority
  Object.keys(grouped).forEach(category => {
    grouped[category as EntityCategory].sort((a, b) => a.createPriority - b.createPriority);
  });

  return grouped;
}

// ==================== EXPORTS ====================

export default ENTITY_REGISTRY;
