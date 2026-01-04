'use client';

/**
 * CREATE CAUSE PAGE
 *
 * Uses the unified CreateEntityWorkflow component for maximum modularity and DRY principles.
 * Leverages existing modular architecture: EntityForm + TemplateSelection + Workflow management.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-27
 * Last Modified Summary: Updated to use CreateEntityWorkflow with templates for consistency
 */

import { CreateEntityWorkflow } from '@/components/create';
import { causeConfig } from '@/config/entity-configs';
import { CauseTemplates } from '@/components/create/templates';

export default function CreateCausePage() {
  return (
    <CreateEntityWorkflow
      config={causeConfig}
      TemplateComponent={CauseTemplates}
      pageHeader={{
        title: 'Create Cause',
        description: 'Start a charitable fundraising campaign and inspire others to support your cause.'
      }}
      showTemplatesByDefault={false}
    />
  );
}
