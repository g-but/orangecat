'use client';

/**
 * CREATE AI ASSISTANT PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Automatically shows template selection (from config.templates) then form.
 *
 * Supports prefill from:
 * - URL params: /dashboard/ai-assistants/create?title=...&description=...
 *
 * Created: 2025-12-25
 * Last Modified: 2026-01-22
 * Last Modified Summary: Migrated to EntityCreationWizard (DRY - single wizard for all entities)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { aiAssistantConfig } from '@/config/entity-configs';
import type { AIAssistantFormData } from '@/lib/validation';

export default function CreateAIAssistantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState<Partial<AIAssistantFormData> | undefined>(
    undefined
  );

  // Prefill support from URL params
  useEffect(() => {
    const title = searchParams?.get('title');
    const description = searchParams?.get('description');
    const category = searchParams?.get('category');

    if (title || description) {
      const prefillData: Partial<AIAssistantFormData> = {};
      if (title) {
        prefillData.title = title;
      }
      if (description) {
        prefillData.description = description;
      }
      if (category) {
        prefillData.category = category;
      }
      setInitialData(prefillData);
    }
  }, [searchParams]);

  return (
    <EntityCreationWizard<AIAssistantFormData>
      config={aiAssistantConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/ai-assistants')}
    />
  );
}
