/**
 * Base Detail Config Factory
 *
 * Factory function for creating detail page configurations with sensible defaults.
 * Reduces boilerplate when creating entity-specific configs.
 *
 * Created: 2026-01-05
 * Last Modified: 2026-01-05
 */

import { EntityType, getEntityMetadata } from '@/config/entity-registry';
import {
  DetailPageConfig,
  LayoutConfig,
  HeaderSectionConfig,
  ContentSectionConfig,
  MetadataSectionConfig,
  CreatorSectionConfig,
  ShareSectionConfig,
  SectionConfig,
} from './types';

// ==================== BASE CONFIG OPTIONS ====================

export interface BaseDetailConfigOptions<T = any> {
  /** Entity type (required) */
  entityType: EntityType;
  /** Override display name */
  name?: string;
  /** Override plural name */
  namePlural?: string;
  /** Override color theme */
  colorTheme?: 'orange' | 'tiffany' | 'rose' | 'blue' | 'green' | 'purple';
  /** Layout configuration */
  layout?: Partial<LayoutConfig>;
  /** Main sections (required) */
  mainSections: SectionConfig[];
  /** Sidebar sections */
  sidebarSections?: SectionConfig[];
  /** SEO configuration */
  seo?: DetailPageConfig<T>['seo'];
  /** Permissions configuration */
  permissions?: DetailPageConfig<T>['permissions'];
  /** Transform entity data */
  transformData?: DetailPageConfig<T>['transformData'];
}

// ==================== FACTORY FUNCTION ====================

/**
 * Create a detail page configuration with defaults from entity-registry
 */
export function createDetailConfig<T = any>(
  options: BaseDetailConfigOptions<T>
): DetailPageConfig<T> {
  const entityMeta = getEntityMetadata(options.entityType);

  return {
    entityType: options.entityType,
    name: options.name || entityMeta.name,
    namePlural: options.namePlural || entityMeta.namePlural,
    colorTheme: options.colorTheme || entityMeta.colorTheme,
    layout: {
      type: 'two-column',
      mainWidth: 2,
      sidebarSticky: true,
      ...options.layout,
    },
    mainSections: options.mainSections,
    sidebarSections: options.sidebarSections,
    seo: options.seo,
    permissions: options.permissions,
    transformData: options.transformData,
    apiEndpoint: entityMeta.apiEndpoint,
    editPath: (id) => `${entityMeta.basePath}/${id}/edit`,
    listPath: entityMeta.basePath,
  };
}

// ==================== COMMON SECTION BUILDERS ====================

/**
 * Create a standard header section
 */
export function createHeaderSection(
  overrides?: Partial<HeaderSectionConfig>
): HeaderSectionConfig {
  return {
    id: 'header',
    type: 'header',
    showStatus: true,
    showCreator: true,
    showCreatedDate: true,
    showCategories: false,
    actions: {
      showEdit: true,
      showShare: true,
      showDelete: false,
    },
    ...overrides,
  };
}

/**
 * Create a content section with fields
 */
export function createContentSection(
  fields: ContentSectionConfig['fields'],
  overrides?: Partial<ContentSectionConfig>
): ContentSectionConfig {
  return {
    id: 'content',
    type: 'content',
    title: 'About',
    fields,
    layout: 'stacked',
    ...overrides,
  };
}

/**
 * Create a metadata section with items
 */
export function createMetadataSection(
  items: MetadataSectionConfig['items'],
  overrides?: Partial<MetadataSectionConfig>
): MetadataSectionConfig {
  return {
    id: 'metadata',
    type: 'metadata',
    layout: 'grid',
    columns: 2,
    items,
    ...overrides,
  };
}

/**
 * Create a creator card section
 */
export function createCreatorSection(
  overrides?: Partial<CreatorSectionConfig>
): CreatorSectionConfig {
  return {
    id: 'creator',
    type: 'creator',
    showAvatar: true,
    showFollowButton: true,
    showBio: true,
    showLocation: false,
    ...overrides,
  };
}

/**
 * Create a share section
 */
export function createShareSection(
  overrides?: Partial<ShareSectionConfig>
): ShareSectionConfig {
  return {
    id: 'share',
    type: 'share',
    platforms: ['twitter', 'copy'],
    showEmbed: false,
    ...overrides,
  };
}

// ==================== COMMON FIELD DEFINITIONS ====================

/** Common description field */
export const descriptionField = {
  field: 'description',
  label: 'Description',
  format: 'text' as const,
};

/** Common status field */
export const statusField = {
  field: 'status',
  label: 'Status',
  format: 'status' as const,
};

/** Common category field */
export const categoryField = {
  field: 'category',
  label: 'Category',
  format: 'text' as const,
};

/** Common created_at field */
export const createdAtField = {
  field: 'created_at',
  label: 'Created',
  format: 'date' as const,
};

/** Common updated_at field */
export const updatedAtField = {
  field: 'updated_at',
  label: 'Last Updated',
  format: 'date' as const,
};

/** Common price field (needs currency) */
export const priceField = {
  field: 'price',
  label: 'Price',
  format: 'currency' as const,
};
