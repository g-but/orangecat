/**
 * Detail Page Configuration Types
 *
 * Defines the structure for configurable entity detail pages.
 * Follows the same SSOT pattern as entity-configs/ for forms.
 *
 * Section-based composition allows building rich detail pages
 * from reusable, configurable components.
 *
 * Created: 2026-01-05
 * Last Modified: 2026-01-05
 */

import { ComponentType } from 'react';
import { LucideIcon } from 'lucide-react';
import { EntityType } from '@/config/entity-registry';

// ==================== SECTION TYPES ====================

export type SectionType =
  | 'header' // Title, status, creator, actions
  | 'hero' // Banner/thumbnail hero image
  | 'media-gallery' // Image gallery with lightbox
  | 'content' // Rich text/description content
  | 'metadata' // Key-value pairs in styled grid
  | 'progress' // Funding/goal progress bar
  | 'timeline' // Activity/updates timeline
  | 'payment' // Bitcoin/Lightning payment info
  | 'related' // Related entities
  | 'creator' // Creator profile card
  | 'share' // Share/social actions
  | 'custom'; // Custom component

// ==================== BASE SECTION CONFIG ====================

export interface BaseSectionConfig {
  /** Unique identifier for this section */
  id: string;
  /** Type of section to render */
  type: SectionType;
  /** Optional title to display above section */
  title?: string;
  /** Conditional rendering based on entity data */
  showWhen?: (entity: any) => boolean;
  /** Additional CSS classes */
  className?: string;
}

// ==================== HEADER SECTION ====================

export interface HeaderSectionConfig extends BaseSectionConfig {
  type: 'header';
  /** Show status badge */
  showStatus?: boolean;
  /** Show creator info (avatar, name) */
  showCreator?: boolean;
  /** Show created date */
  showCreatedDate?: boolean;
  /** Show category badges */
  showCategories?: boolean;
  /** Action buttons configuration */
  actions?: {
    showEdit?: boolean;
    showShare?: boolean;
    showDelete?: boolean;
    custom?: Array<{
      label: string;
      icon?: LucideIcon;
      href?: (entity: any) => string;
      onClick?: (entity: any) => void;
      variant?: 'default' | 'primary' | 'secondary' | 'destructive';
      showWhen?: (entity: any, isOwner: boolean) => boolean;
    }>;
  };
}

// ==================== HERO SECTION ====================

export interface HeroSectionConfig extends BaseSectionConfig {
  type: 'hero';
  /** Field containing the image URL */
  imageField: string;
  /** Fallback image field if primary is empty */
  fallbackField?: string;
  /** Aspect ratio for the hero image */
  aspectRatio?: 'video' | 'square' | 'wide' | 'banner';
  /** Show overlay gradient */
  showOverlay?: boolean;
}

// ==================== MEDIA GALLERY SECTION ====================

export interface MediaGallerySectionConfig extends BaseSectionConfig {
  type: 'media-gallery';
  /** Database table for media (e.g., 'project_media') */
  mediaTable?: string;
  /** Or field on entity containing array of images */
  mediaField?: string;
  /** Maximum thumbnails to show before "show more" */
  maxThumbnails?: number;
  /** Enable lightbox on click */
  enableLightbox?: boolean;
}

// ==================== CONTENT SECTION ====================

export interface ContentFieldConfig {
  /** Field name on entity */
  field: string;
  /** Display label */
  label: string;
  /** How to format the value */
  format?: 'text' | 'html' | 'markdown' | 'url' | 'currency' | 'date';
  /** Optional icon */
  icon?: LucideIcon;
  /** Conditional rendering */
  showWhen?: (entity: any) => boolean;
}

export interface ContentSectionConfig extends BaseSectionConfig {
  type: 'content';
  /** Fields to display in this content section */
  fields: ContentFieldConfig[];
  /** Layout style */
  layout?: 'stacked' | 'columns';
}

// ==================== METADATA SECTION ====================

export interface MetadataItemConfig {
  /** Field name on entity */
  field: string;
  /** Display label */
  label: string;
  /** How to format the value */
  format?: 'text' | 'date' | 'datetime' | 'currency' | 'boolean' | 'status' | 'array' | 'number';
  /** Optional icon */
  icon?: LucideIcon;
  /** Conditional rendering */
  showWhen?: (entity: any) => boolean;
  /** Link URL (can reference entity fields) */
  linkTo?: (entity: any) => string;
}

export interface MetadataSectionConfig extends BaseSectionConfig {
  type: 'metadata';
  /** Layout style */
  layout?: 'grid' | 'list' | 'inline';
  /** Number of columns for grid layout */
  columns?: 2 | 3 | 4;
  /** Items to display */
  items: MetadataItemConfig[];
}

// ==================== PROGRESS SECTION ====================

export interface ProgressSectionConfig extends BaseSectionConfig {
  type: 'progress';
  /** Field containing the goal amount */
  goalField: string;
  /** Field containing current amount */
  currentField: string;
  /** Field containing currency code */
  currencyField?: string;
  /** Show Bitcoin balance if available */
  showBitcoinBalance?: boolean;
  /** Field containing Bitcoin balance in sats */
  bitcoinBalanceField?: string;
  /** Show supporter/backer count */
  showSupporters?: boolean;
  /** Field containing supporter count */
  supportersField?: string;
  /** Label for the progress (e.g., "Funded", "Raised") */
  progressLabel?: string;
}

// ==================== TIMELINE SECTION ====================

export interface TimelineSectionConfig extends BaseSectionConfig {
  type: 'timeline';
  /** Type of feed/timeline */
  feedType: 'project' | 'product' | 'service' | 'cause' | 'general';
  /** Allow posting to timeline (for owners) */
  allowPosts?: boolean;
  /** Show filter controls */
  showFilters?: boolean;
  /** Maximum items to show initially */
  initialLimit?: number;
}

// ==================== PAYMENT SECTION ====================

export interface PaymentSectionConfig extends BaseSectionConfig {
  type: 'payment';
  /** Field containing Bitcoin address */
  bitcoinAddressField?: string;
  /** Field containing Lightning address */
  lightningAddressField?: string;
  /** Show QR codes */
  showQRCodes?: boolean;
  /** Show copy buttons */
  showCopyButtons?: boolean;
  /** Title for the payment section */
  paymentTitle?: string;
}

// ==================== RELATED SECTION ====================

export interface RelatedSectionConfig extends BaseSectionConfig {
  type: 'related';
  /** Type of related entities to show */
  relatedEntityType: EntityType;
  /** How to fetch related entities */
  relationField?: string;
  /** Maximum items to show */
  maxItems?: number;
}

// ==================== CREATOR SECTION ====================

export interface CreatorSectionConfig extends BaseSectionConfig {
  type: 'creator';
  /** Show avatar */
  showAvatar?: boolean;
  /** Show follow button */
  showFollowButton?: boolean;
  /** Show bio excerpt */
  showBio?: boolean;
  /** Show location */
  showLocation?: boolean;
}

// ==================== SHARE SECTION ====================

export interface ShareSectionConfig extends BaseSectionConfig {
  type: 'share';
  /** Platforms to show share buttons for */
  platforms?: ('twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram' | 'copy')[];
  /** Show embed code */
  showEmbed?: boolean;
}

// ==================== CUSTOM SECTION ====================

export interface CustomSectionConfig extends BaseSectionConfig {
  type: 'custom';
  /** Custom component to render */
  component: ComponentType<{
    entity: any;
    isOwner: boolean;
    userCurrency?: string;
  }>;
}

// ==================== UNION TYPE ====================

export type SectionConfig =
  | HeaderSectionConfig
  | HeroSectionConfig
  | MediaGallerySectionConfig
  | ContentSectionConfig
  | MetadataSectionConfig
  | ProgressSectionConfig
  | TimelineSectionConfig
  | PaymentSectionConfig
  | RelatedSectionConfig
  | CreatorSectionConfig
  | ShareSectionConfig
  | CustomSectionConfig;

// ==================== LAYOUT CONFIG ====================

export type LayoutType = 'two-column' | 'single-column' | 'grid';

export interface LayoutConfig {
  /** Layout type */
  type: LayoutType;
  /** Width ratio for main column (in two-column layout) */
  mainWidth?: 2 | 3;
  /** Make sidebar sticky */
  sidebarSticky?: boolean;
  /** Number of columns for grid layout */
  columns?: 2 | 3 | 4;
}

// ==================== SEO CONFIG ====================

export interface SeoConfig<T = any> {
  /** Template for page title */
  titleTemplate?: (entity: T) => string;
  /** Field to use for meta description */
  descriptionField?: string;
  /** Field to use for OG image */
  imageField?: string;
  /** Generate JSON-LD structured data */
  generateStructuredData?: (entity: T, creator?: any) => Record<string, any>;
}

// ==================== PERMISSIONS CONFIG ====================

export interface PermissionsConfig {
  /** Who can view this detail page */
  viewAccess?: 'public' | 'authenticated' | 'owner';
  /** Fields that only the owner can see */
  ownerOnlyFields?: string[];
}

// ==================== MAIN DETAIL PAGE CONFIG ====================

export interface DetailPageConfig<T = any> {
  /** Entity type this config is for */
  entityType: EntityType;
  /** Display name for the entity */
  name: string;
  /** Plural display name */
  namePlural?: string;
  /** Color theme */
  colorTheme?: 'orange' | 'tiffany' | 'rose' | 'blue' | 'green' | 'purple' | 'indigo';
  /** Layout configuration */
  layout: LayoutConfig;
  /** Sections to render in the main content area */
  mainSections: SectionConfig[];
  /** Sections to render in the sidebar (for two-column layout) */
  sidebarSections?: SectionConfig[];
  /** SEO configuration */
  seo?: SeoConfig<T>;
  /** Permissions configuration */
  permissions?: PermissionsConfig;
  /** Transform entity data before rendering */
  transformData?: (entity: T, userCurrency?: string) => T;
  /** API endpoint for fetching entity */
  apiEndpoint?: string;
  /** Path for edit page */
  editPath?: (id: string) => string;
  /** Path for list page (back button) */
  listPath?: string;
}

// ==================== HELPER TYPES ====================

/** Props passed to the EntityDetailRenderer */
export interface EntityDetailRendererProps<T = any> {
  /** The entity data to render */
  entity: T;
  /** Detail page configuration */
  config: DetailPageConfig<T>;
  /** Whether the current user is the owner */
  isOwner?: boolean;
  /** User's preferred currency */
  userCurrency?: string;
  /** Creator/owner profile data */
  creator?: any;
}

/** Props passed to individual section components */
export interface SectionRendererProps<T = any> {
  /** Section configuration */
  config: SectionConfig;
  /** The entity data */
  entity: T;
  /** Whether the current user is the owner */
  isOwner: boolean;
  /** User's preferred currency */
  userCurrency?: string;
  /** Creator/owner profile data */
  creator?: any;
}
