/**
 * Template Index
 *
 * Re-exports all template arrays and components from individual files.
 * This provides a single import point for all templates.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

// Export template arrays
export { PRODUCT_TEMPLATES } from './product-templates';
export { SERVICE_TEMPLATES } from './service-templates';
export { CAUSE_TEMPLATES } from './cause-templates';
export { LOAN_TEMPLATES } from './loan-templates';
export { AI_ASSISTANT_TEMPLATES } from './ai-assistant-templates';
export { PROJECT_TEMPLATES } from './project-templates';
export type { ProjectDefaults } from './project-templates';
export { ASSET_TEMPLATES } from './asset-templates';
export type { AssetDefaults } from './asset-templates';
export { EVENT_TEMPLATES } from './event-templates';
export { GROUP_TEMPLATES } from './group-templates';
export { WISHLIST_TEMPLATES, WISHLIST_ITEM_TEMPLATES, WISHLIST_TEMPLATE_CATEGORIES, WISHLIST_ITEM_TEMPLATE_CATEGORIES } from './wishlist-templates';
export type { WishlistDefaults, WishlistTemplate, WishlistItemDefaults, WishlistItemTemplate, WishlistTemplateCategory, WishlistItemTemplateCategory } from './wishlist-templates';

// Export template components (from template-factory.tsx)
export {
  ProductTemplates,
  ServiceTemplates,
  CauseTemplates,
  LoanTemplates,
  AIAssistantTemplates,
  ProjectTemplates,
  AssetTemplates,
  EventTemplates,
  GroupTemplates,
  WishlistTemplates,
  type ProductTemplate,
  type ServiceTemplate,
  type CauseTemplate,
  type LoanTemplate,
  type AIAssistantTemplate,
  type ProjectTemplate,
  type AssetTemplate,
  type EventTemplate,
  type GroupTemplate,
} from './template-factory';

// Export custom template components
export { CircleTemplates } from './CircleTemplates';
export { default as OrganizationTemplates, ORGANIZATION_TEMPLATES } from './OrganizationTemplates';
