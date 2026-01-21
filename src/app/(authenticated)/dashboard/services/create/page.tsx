'use client';

/**
 * CREATE SERVICE PAGE
 *
 * Uses the unified CreateEntityWorkflow component for maximum modularity and DRY principles.
 * Leverages existing modular architecture: EntityForm + TemplateSelection + Workflow management.
 *
 * Supports prefill from:
 * - URL params: /dashboard/services/create?title=...&description=...
 * - localStorage: service_prefill (legacy)
 *
 * Created: 2025-12-03
 * Last Modified: 2026-01-21
 * Last Modified Summary: Added URL params prefill support from My Cat AI
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreateEntityWorkflow } from '@/components/create';
import { serviceConfig } from '@/config/entity-configs';
import { ServiceTemplates } from '@/components/create/templates';

export default function CreateServicePage() {
  const searchParams = useSearchParams();
  const [initialValues, setInitialValues] = useState<Record<string, unknown> | undefined>(
    undefined
  );

  useEffect(() => {
    // Check URL params first (from My Cat action buttons)
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
      return;
    }

    // Fall back to localStorage (legacy support)
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
  }, [searchParams]);

  return (
    <CreateEntityWorkflow
      config={serviceConfig}
      TemplateComponent={ServiceTemplates}
      pageHeader={{
        title: 'Create Service',
        description: 'Offer your expertise to the community.',
      }}
      initialValues={initialValues}
      showTemplatesByDefault={false}
    />
  );
}
