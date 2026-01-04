'use client';

/**
 * CREATE ASSET PAGE
 *
 * Uses the unified CreateEntityWorkflow component for maximum modularity and DRY principles.
 * Leverages existing modular architecture: EntityForm + TemplateSelection + Workflow management.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-31
 * Last Modified Summary: Moved to /dashboard/assets/create for path consistency
 */

import { CreateEntityWorkflow } from '@/components/create';
import { assetConfig } from '@/config/entity-configs';
import { AssetTemplates } from '@/components/create/templates';

export default function CreateAssetPage() {
  return (
    <CreateEntityWorkflow
      config={assetConfig}
      TemplateComponent={AssetTemplates}
      pageHeader={{
        title: 'Create Asset',
        description: 'List an asset you own. You can use it later as collateral for loans.'
      }}
      showTemplatesByDefault={false}
    />
  );
}
