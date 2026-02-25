'use client';

/**
 * CREATE/EDIT AI ASSISTANT PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Supports both create and edit modes via query parameter.
 *
 * Created: 2025-12-25
 * Last Modified: 2026-02-24
 * Last Modified Summary: Added edit mode support (?edit=id)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { aiAssistantConfig } from '@/config/entity-configs';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import type { AIAssistantFormData } from '@/lib/validation';

export default function CreateAIAssistantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [assistantData, setAssistantData] = useState<Partial<AIAssistantFormData> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [editError, setEditError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<AIAssistantFormData> | undefined>(
    undefined
  );

  // Fetch assistant data if in edit mode
  useEffect(() => {
    if (editId && user?.id && hydrated) {
      const fetchAssistant = async () => {
        try {
          const response = await fetch(`/api/ai-assistants/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setAssistantData(result.data);
            } else {
              setEditError('Failed to load AI assistant data');
            }
          } else {
            setEditError(
              response.status === 404
                ? 'AI assistant not found'
                : 'Failed to load AI assistant data'
            );
          }
        } catch (error) {
          logger.error('Failed to fetch AI assistant:', error);
          setEditError('Failed to load AI assistant data');
        } finally {
          setLoading(false);
        }
      };
      fetchAssistant();
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
  }, [searchParams, editId]);

  if (loading) {
    return <Loading fullScreen message="Loading AI assistant..." />;
  }

  if (editId && editError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">{editError}</h3>
        <p className="text-gray-500 mb-4">Unable to load AI assistant for editing.</p>
        <button
          onClick={() => router.push('/dashboard/ai-assistants')}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Back to AI assistants
        </button>
      </div>
    );
  }

  if (editId && assistantData) {
    return (
      <EntityForm
        config={aiAssistantConfig}
        initialValues={assistantData}
        mode="edit"
        entityId={editId}
      />
    );
  }

  return (
    <EntityCreationWizard<AIAssistantFormData>
      config={aiAssistantConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/ai-assistants')}
    />
  );
}
