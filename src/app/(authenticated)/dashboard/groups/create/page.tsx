'use client';

/**
 * CREATE GROUP PAGE
 *
 * Uses the unified CreateEntityWorkflow component for maximum modularity and DRY principles.
 * Leverages existing modular architecture: EntityForm + TemplateSelection + Workflow management.
 *
 * Created: 2025-12-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Moved to /dashboard/groups/create for consistency
 */

import { CreateEntityWorkflow } from '@/components/create';
import { groupConfig } from '@/config/entity-configs';
import { GroupTemplates } from '@/components/create/templates';

export default function CreateGroupPage() {
  return (
    <CreateEntityWorkflow
      config={groupConfig}
      TemplateComponent={GroupTemplates}
      pageHeader={{
        title: 'Create Group',
        description: 'Start a new group, circle, or organization to collaborate with others.',
      }}
    />
  );
}
