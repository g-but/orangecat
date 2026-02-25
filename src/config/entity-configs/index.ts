/**
 * Entity Configurations - Barrel Export
 *
 * Central export for all entity configurations.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-04
 * Last Modified Summary: Added Circle and Loan configurations
 */

export { productConfig } from './product-config';
export { serviceConfig } from './service-config';
export { causeConfig } from './cause-config';
export { circleConfig } from './circle-config';
export { loanConfig } from './loan-config';
export { assetConfig } from './asset-config';
export type { AssetFormData } from '@/lib/validation';
export { organizationConfig } from './organization-config';
export { projectConfig } from './project-config';
export { aiAssistantConfig } from './ai-assistant-config';
export { eventConfig } from './event-config';
export { groupConfig } from './group-config';
export { wishlistConfig } from './wishlist-config';
export { researchWizardConfig } from './research-wizard-config';
export type { ResearchWizardFormData } from './research-wizard-config';
export { documentFormConfig } from './document-form-config';

// Re-export types
export type { EntityConfig, FieldGroup, FieldConfig } from '@/components/create/types';
