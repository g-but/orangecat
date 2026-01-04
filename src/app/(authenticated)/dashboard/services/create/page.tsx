'use client';

/**
 * CREATE SERVICE PAGE
 *
 * Uses the unified CreateEntityWorkflow component for maximum modularity and DRY principles.
 * Leverages existing modular architecture: EntityForm + TemplateSelection + Workflow management.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-01-28
 * Last Modified Summary: Updated to use CreateEntityWorkflow for consistency
 */

import { CreateEntityWorkflow } from '@/components/create';
import { serviceConfig } from '@/config/entity-configs';
import { ServiceTemplates } from '@/components/create/templates';

export default function CreateServicePage() {
  return (
    <CreateEntityWorkflow
      config={serviceConfig}
      TemplateComponent={ServiceTemplates}
      pageHeader={{
        title: 'Create Service',
        description: 'Offer your expertise to the community.'
      }}
      showTemplatesByDefault={false}
    />
  );
}
