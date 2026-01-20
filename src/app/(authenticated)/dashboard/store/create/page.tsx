'use client';

/**
 * CREATE PRODUCT PAGE
 *
 * Uses the unified CreateEntityWorkflow component for maximum modularity and DRY principles.
 * Leverages existing modular architecture: EntityForm + TemplateSelection + Workflow management.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-01-28
 * Last Modified Summary: Updated to use CreateEntityWorkflow for consistency
 */

import { useEffect, useState } from 'react';
import { CreateEntityWorkflow } from '@/components/create';
import { productConfig } from '@/config/entity-configs';
import { ProductTemplates } from '@/components/create/templates';

export default function CreateProductPage() {
  const [initialValues, setInitialValues] = useState<Record<string, unknown> | undefined>(
    undefined
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem('product_prefill');
      if (raw) {
        const data = JSON.parse(raw);
        setInitialValues(data);
        localStorage.removeItem('product_prefill');
      }
    } catch {}
  }, []);

  return (
    <CreateEntityWorkflow
      config={productConfig}
      TemplateComponent={ProductTemplates}
      pageHeader={{
        title: 'Create Product',
        description: 'Add a new product to your personal marketplace.'
      }}
      initialValues={initialValues}
      showTemplatesByDefault={false}
    />
  );
}
