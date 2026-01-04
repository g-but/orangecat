'use client';

/**
 * CREATE PROJECT PAGE
 *
 * Uses the unified CreateEntityWorkflow component for maximum modularity and DRY principles.
 * Leverages existing modular architecture: EntityForm + TemplateSelection + Workflow management.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-31
 * Last Modified Summary: Moved to /dashboard/projects/create for path consistency
 */

import { CreateEntityWorkflow } from '@/components/create';
import { projectConfig } from '@/config/entity-configs';
import { ProjectTemplates } from '@/components/create/templates';

export default function CreateProjectPage() {
  return (
    <CreateEntityWorkflow
      config={projectConfig}
      TemplateComponent={ProjectTemplates}
      pageHeader={{
        title: 'Create Project',
        description: 'Start a fundraising project and accept Bitcoin donations.'
      }}
      showTemplatesByDefault={false}
    />
  );
}
