'use client';

/**
 * CREATE PRODUCT PAGE
 *
 * Uses the unified EntityForm component with useTemplateSelection hook.
 * Templates appear at the bottom to help users who need inspiration.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-23
 * Last Modified Summary: Removed debug code, cleaned up page
 */

import { EntityForm } from '@/components/create';
import { productConfig } from '@/config/entity-configs';
import { ProductTemplates } from '@/components/create/templates';
import { useTemplateSelection } from '@/hooks/useTemplateSelection';

export default function CreateProductPage() {
  const { mergedConfig, handleSelectTemplate } = useTemplateSelection(productConfig);

  return (
    <div className="space-y-6">
      <EntityForm config={mergedConfig} />
      <ProductTemplates onSelectTemplate={handleSelectTemplate} />
    </div>
  );
}
