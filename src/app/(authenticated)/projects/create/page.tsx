'use client';

/**
 * CREATE PROJECT PAGE
 *
 * Uses the unified EntityForm component with useTemplateSelection hook.
 * Templates appear at the bottom to help users who need inspiration.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-16
 * Last Modified Summary: Refactored to use standard unified pattern
 */

import { EntityForm } from '@/components/create';
import { projectConfig } from '@/config/entity-configs';
import { ProjectTemplates } from '@/components/create/templates';
import { useTemplateSelection } from '@/hooks/useTemplateSelection';

export default function CreateProjectPage() {
  const { mergedConfig, handleSelectTemplate } = useTemplateSelection(projectConfig);

  return (
    <div className="space-y-6">
      <EntityForm config={mergedConfig} />
      <ProjectTemplates onSelectTemplate={handleSelectTemplate} />
    </div>
  );
}