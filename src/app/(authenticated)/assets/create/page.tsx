'use client';

/**
 * CREATE ASSET PAGE
 *
 * Uses the unified EntityForm component with useTemplateSelection hook.
 * Templates appear at the bottom to help users who need inspiration.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-16
 * Last Modified Summary: Moved templates to bottom of form
 */

import { EntityForm } from '@/components/create';
import { assetConfig } from '@/config/entity-configs';
import { AssetTemplates } from '@/components/create/templates';
import { useTemplateSelection } from '@/hooks/useTemplateSelection';

export default function CreateAssetPage() {
  const { mergedConfig, handleSelectTemplate } = useTemplateSelection(assetConfig);

  return (
    <div className="space-y-6">
      <EntityForm config={mergedConfig} />
      <AssetTemplates onSelectTemplate={handleSelectTemplate} />
    </div>
  );
}
