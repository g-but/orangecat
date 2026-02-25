'use client';

/**
 * CREATE/EDIT RESEARCH PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Supports both create and edit modes via query parameter.
 *
 * Supports:
 * - Create mode: /dashboard/research/create (shows template selection then form)
 * - Edit mode: /dashboard/research/create?edit=<id> (shows form directly with existing data)
 * - Prefill from URL params: /dashboard/research/create?title=...&description=...
 *
 * Created: 2026-02-09
 * Last Modified: 2026-02-24
 * Last Modified Summary: Migrated from custom form to EntityCreationWizard (unified workflow)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { researchWizardConfig } from '@/config/entity-configs';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import type { ResearchWizardFormData } from '@/config/entity-configs';

export default function CreateResearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [researchData, setResearchData] = useState<Partial<ResearchWizardFormData> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [editError, setEditError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<ResearchWizardFormData> | undefined>(
    undefined
  );

  // Fetch research data if in edit mode
  useEffect(() => {
    if (editId && user?.id && hydrated) {
      const fetchResearch = async () => {
        try {
          const response = await fetch(`/api/research/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setResearchData(result.data);
            } else {
              setEditError('Failed to load research data');
            }
          } else {
            setEditError(
              response.status === 404 ? 'Research not found' : 'Failed to load research data'
            );
          }
        } catch (error) {
          logger.error('Failed to fetch research:', error);
          setEditError('Failed to load research data');
        } finally {
          setLoading(false);
        }
      };
      fetchResearch();
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
    const field = searchParams?.get('field');

    if (title || description) {
      const prefillData: Partial<ResearchWizardFormData> = {};
      if (title) {
        prefillData.title = title;
      }
      if (description) {
        prefillData.description = description;
      }
      if (field) {
        prefillData.field = field;
      }
      setInitialData(prefillData);
    }
  }, [searchParams, editId]);

  if (loading) {
    return <Loading fullScreen message="Loading research..." />;
  }

  // Edit mode: show error if fetch failed
  if (editId && editError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">{editError}</h3>
        <p className="text-gray-500 mb-4">Unable to load research for editing.</p>
        <button
          onClick={() => router.push('/dashboard/research')}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Back to research
        </button>
      </div>
    );
  }

  // Edit mode: use EntityForm directly (skip template selection)
  if (editId && researchData) {
    return (
      <EntityForm
        config={researchWizardConfig}
        initialValues={researchData}
        mode="edit"
        entityId={editId}
      />
    );
  }

  // Create mode: use EntityCreationWizard
  return (
    <EntityCreationWizard<ResearchWizardFormData>
      config={researchWizardConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/research')}
    />
  );
}
