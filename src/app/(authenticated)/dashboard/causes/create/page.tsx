'use client';

/**
 * CREATE CAUSE PAGE
 *
 * Uses the unified CreateEntityWorkflow component for maximum modularity and DRY principles.
 * Leverages existing modular architecture: EntityForm + TemplateSelection + Workflow management.
 *
 * Supports prefill from:
 * - URL params: /dashboard/causes/create?title=...&description=...
 *
 * Created: 2025-12-03
 * Last Modified: 2026-01-21
 * Last Modified Summary: Added URL params prefill support from My Cat AI
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreateEntityWorkflow } from '@/components/create';
import { causeConfig } from '@/config/entity-configs';
import { CauseTemplates } from '@/components/create/templates';

export default function CreateCausePage() {
  const searchParams = useSearchParams();
  const [initialValues, setInitialValues] = useState<Record<string, unknown> | undefined>(
    undefined
  );

  useEffect(() => {
    // Check URL params (from My Cat action buttons)
    const title = searchParams?.get('title');
    const description = searchParams?.get('description');
    const category = searchParams?.get('category');

    if (title || description) {
      const prefillData: Record<string, unknown> = {};
      if (title) {
        prefillData.title = title;
      }
      if (description) {
        prefillData.description = description;
      }
      if (category) {
        prefillData.category = category;
      }
      setInitialValues(prefillData);
    }
  }, [searchParams]);

  return (
    <CreateEntityWorkflow
      config={causeConfig}
      TemplateComponent={CauseTemplates}
      pageHeader={{
        title: 'Create Cause',
        description:
          'Start a charitable fundraising campaign and inspire others to support your cause.',
      }}
      initialValues={initialValues}
      showTemplatesByDefault={false}
    />
  );
}
