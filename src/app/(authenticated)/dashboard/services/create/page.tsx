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

import { useEffect, useState } from 'react';
import { CreateEntityWorkflow } from '@/components/create';
import { serviceConfig } from '@/config/entity-configs';
import { ServiceTemplates } from '@/components/create/templates';

export default function CreateServicePage() {
  const [initialValues, setInitialValues] = useState<Record<string, unknown> | undefined>(
    undefined
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem('service_prefill');
      if (raw) {
        const data = JSON.parse(raw);
        setInitialValues(data);
        localStorage.removeItem('service_prefill');
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  return (
    <CreateEntityWorkflow
      config={serviceConfig}
      TemplateComponent={ServiceTemplates}
      pageHeader={{
        title: 'Create Service',
        description: 'Offer your expertise to the community.'
      }}
      initialValues={initialValues}
      showTemplatesByDefault={false}
    />
  );
}
