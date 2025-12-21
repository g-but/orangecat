'use client';

/**
 * CREATE CIRCLE PAGE
 *
 * Uses the unified CreateEntityWorkflow component for consistent, maintainable code.
 * Follows DRY principles and modular architecture.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-01-XX
 * Last Modified Summary: Refactored to use CreateEntityWorkflow for modularity and DRY
 */

import { EntityForm } from '@/components/create';
import { circleConfig } from '@/config/entity-configs';
import { CircleTemplates } from '@/components/create/templates';
import { useTemplateSelection } from '@/hooks/useTemplateSelection';

export default function CreateCirclePage() {
  const { mergedConfig, handleSelectTemplate } = useTemplateSelection(circleConfig);

  return (
    <div className="space-y-6">
      <EntityForm config={mergedConfig} />
      <CircleTemplates onSelectTemplate={handleSelectTemplate} />
    </div>
  );
}



























