'use client';

/**
 * CREATE/EDIT GROUP PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Supports both create and edit modes via query parameter.
 *
 * Created: 2025-12-30
 * Last Modified: 2026-02-24
 * Last Modified Summary: Added edit mode support (?edit=id)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { groupConfig } from '@/config/entity-configs';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import type { CreateGroupSchemaType } from '@/services/groups/validation';

export default function CreateGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [groupData, setGroupData] = useState<Partial<CreateGroupSchemaType> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [editError, setEditError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<CreateGroupSchemaType> | undefined>(
    undefined
  );

  // Fetch group data if in edit mode
  useEffect(() => {
    if (editId && user?.id && hydrated) {
      const fetchGroup = async () => {
        try {
          const response = await fetch(`/api/groups/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setGroupData(result.data);
            } else {
              setEditError('Failed to load group data');
            }
          } else {
            setEditError(response.status === 404 ? 'Group not found' : 'Failed to load group data');
          }
        } catch (error) {
          logger.error('Failed to fetch group:', error);
          setEditError('Failed to load group data');
        } finally {
          setLoading(false);
        }
      };
      fetchGroup();
    } else if (!editId) {
      setLoading(false);
    }
  }, [editId, user?.id, hydrated]);

  // Prefill support from URL params (create mode only)
  useEffect(() => {
    if (editId) {
      return;
    }

    const name = searchParams?.get('name');
    const description = searchParams?.get('description');
    const label = searchParams?.get('label');

    if (name || description) {
      const prefillData: Partial<CreateGroupSchemaType> = {};
      if (name) {
        prefillData.name = name;
      }
      if (description) {
        prefillData.description = description;
      }
      if (label) {
        prefillData.label = label as CreateGroupSchemaType['label'];
      }
      setInitialData(prefillData);
    }
  }, [searchParams, editId]);

  if (loading) {
    return <Loading fullScreen message="Loading group..." />;
  }

  if (editId && editError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">{editError}</h3>
        <p className="text-gray-500 mb-4">Unable to load group for editing.</p>
        <button
          onClick={() => router.push('/dashboard/groups')}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Back to groups
        </button>
      </div>
    );
  }

  if (editId && groupData) {
    return (
      <EntityForm config={groupConfig} initialValues={groupData} mode="edit" entityId={editId} />
    );
  }

  return (
    <EntityCreationWizard<CreateGroupSchemaType>
      config={groupConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/groups')}
    />
  );
}
