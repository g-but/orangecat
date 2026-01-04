/**
 * TEMPLATE TRANSFORMERS
 *
 * Utility functions to transform template data into form-compatible values.
 * Ensures DRY principle and consistent data transformation across entity types.
 */

import type { UserCircleFormData, OrganizationFormData } from '@/lib/validation';
import type { CircleTemplate } from '@/config/entity-configs/circle-config';

/**
 * Transform circle template to form data
 */
export function transformCircleTemplate(
  template: CircleTemplate | null
): Partial<UserCircleFormData> {
  if (!template) {
    return {};
  }

  return {
    name: template.name,
    description: template.description,
    category: template.category,
    ...template.suggestedSettings,
  };
}

/**
 * Transform organization template to form data
 */
export function transformOrganizationTemplate(
  template: any | null
): Partial<OrganizationFormData> {
  if (!template || !template.suggestedSettings) {
    return {};
  }

  return {
    type: template.type || 'community',
    governance_model: template.suggestedSettings?.governance_model || 'hierarchical',
    is_public: template.suggestedSettings?.is_public ?? true,
    requires_approval: template.suggestedSettings?.requires_approval ?? true,
    tags: template.suggestedSettings?.tags || [],
    ...template.suggestedSettings,
  };
}

