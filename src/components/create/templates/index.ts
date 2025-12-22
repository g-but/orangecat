/**
 * Templates Module Exports
 *
 * Pre-filled entity templates for inspiration.
 * All templates use the unified EntityTemplate interface from types.ts
 *
 * @module components/create/templates
 */

// Re-export unified types
export type { EntityTemplate } from '../types';

// Template picker component
export { TemplatePicker, type GenericTemplate } from './TemplatePicker';

// Entity-specific templates
export { ProjectTemplates, PROJECT_TEMPLATES } from './ProjectTemplates';
export type { ProjectTemplate } from './ProjectTemplates';

export { AssetTemplates, ASSET_TEMPLATES } from './AssetTemplates';
export type { AssetTemplate } from './AssetTemplates';

export { ServiceTemplates, SERVICE_TEMPLATES } from './ServiceTemplates';
export type { ServiceTemplate } from './ServiceTemplates';

export { ProductTemplates, PRODUCT_TEMPLATES } from './ProductTemplates';
export type { ProductTemplate } from './ProductTemplates';

export { CircleTemplates, CIRCLE_TEMPLATES } from './CircleTemplates';
export type { CircleTemplate } from './CircleTemplates';
