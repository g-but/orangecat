'use client';

/**
 * CREATE/EDIT CAUSE PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Supports both create and edit modes via query parameter.
 *
 * Supports:
 * - Create mode: /dashboard/causes/create (shows template selection then form)
 * - Edit mode: /dashboard/causes/create?edit=<id> (shows form directly with existing data)
 * - Prefill from URL params: /dashboard/causes/create?title=...&description=...
 *
 * Created: 2025-12-03
 * Last Modified: 2026-02-09
 * Last Modified Summary: Added edit mode support (mirrors loans/create pattern)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { causeConfig } from '@/config/entity-configs';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import type { UserCauseFormData } from '@/lib/validation';

export default function CreateCausePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [causeData, setCauseData] = useState<Partial<UserCauseFormData> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [initialData, setInitialData] = useState<Partial<UserCauseFormData> | undefined>(undefined);

  // Fetch cause data if in edit mode
  useEffect(() => {
    if (editId && user?.id && hydrated) {
      const fetchCause = async () => {
        try {
          const response = await fetch(`/api/causes/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setCauseData(result.data);
            }
          }
        } catch (error) {
          logger.error('Failed to fetch cause:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCause();
    } else if (!editId) {
      setLoading(false);
    }
  }, [editId, user?.id, hydrated]);

  // Prefill support from URL params (create mode only)
  useEffect(() => {
    if (editId) {
      return;
    }

    const title = searchParams?.get('title');
    const description = searchParams?.get('description');
    const category = searchParams?.get('category');

    if (title || description) {
      const prefillData: Partial<UserCauseFormData> = {};
      if (title) {
        prefillData.title = title;
      }
      if (description) {
        prefillData.description = description;
      }
      if (category) {
        prefillData.cause_category = category;
      }
      setInitialData(prefillData);
    }
  }, [searchParams, editId]);

  if (loading) {
    return <Loading fullScreen message="Loading cause..." />;
  }

  // Edit mode: use EntityForm directly (skip template selection)
  if (editId && causeData) {
    return (
      <EntityForm config={causeConfig} initialValues={causeData} mode="edit" entityId={editId} />
    );
  }

  // Create mode: use EntityCreationWizard
  return (
    <EntityCreationWizard<UserCauseFormData>
      config={causeConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/causes')}
    />
  );
}
