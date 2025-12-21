'use client';

/**
 * CREATE ORGANIZATION PAGE
 *
 * Uses the unified CreateEntityWorkflow component for consistent, maintainable code.
 * Follows DRY principles and modular architecture.
 *
 * Created: 2025-12-06
 * Last Modified: 2025-01-XX
 * Last Modified Summary: Refactored to use CreateEntityWorkflow for modularity and DRY
 */

import { EntityForm } from '@/components/create';
import { organizationConfig } from '@/config/entity-configs';
import OrganizationTemplates from '@/components/create/templates/OrganizationTemplates';
import { useTemplateSelection } from '@/hooks/useTemplateSelection';

export default function CreateOrganizationPage() {
  const { mergedConfig, handleSelectTemplate } = useTemplateSelection(organizationConfig);

  return (
    <div className="space-y-6">
      <EntityForm config={mergedConfig} />
      <OrganizationTemplates onSelectTemplate={handleSelectTemplate} />
    </div>
  );
}

