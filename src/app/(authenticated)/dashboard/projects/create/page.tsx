'use client';

/**
 * CREATE/EDIT PROJECT PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Supports both create and edit modes via query parameter.
 *
 * Created: 2025-12-03
 * Last Modified: 2026-02-24
 * Last Modified Summary: Added edit mode support (?edit=id)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCreatePrefill } from '@/hooks/useCreatePrefill';
import { EntityCreationWizard } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { projectConfig } from '@/config/entity-configs/project-config';
import Loading from '@/components/Loading';
import { logger } from '@/utils/logger';
import type { ProjectData } from '@/lib/validation';

export default function CreateProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { isLoading, isAuthenticated, user, hydrated } = useRequireAuth();
  const [projectData, setProjectData] = useState<Partial<ProjectData> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [editError, setEditError] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  const { initialData } = useCreatePrefill<ProjectData>({
    entityType: 'project',
    enabled: isAuthenticated && !editId,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasRedirected) {
      setHasRedirected(true);
      router.push('/auth?mode=login&from=/dashboard/projects/create');
    }
  }, [isLoading, isAuthenticated, router, hasRedirected]);

  // Fetch project data if in edit mode
  useEffect(() => {
    if (editId && user?.id && hydrated) {
      const fetchProject = async () => {
        try {
          const response = await fetch(`/api/projects/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setProjectData(result.data);
            } else {
              setEditError('Failed to load project data');
            }
          } else {
            setEditError(
              response.status === 404 ? 'Project not found' : 'Failed to load project data'
            );
          }
        } catch (error) {
          logger.error('Failed to fetch project:', error);
          setEditError('Failed to load project data');
        } finally {
          setLoading(false);
        }
      };
      fetchProject();
    } else if (!editId) {
      setLoading(false);
    }
  }, [editId, user?.id, hydrated]);

  if (isLoading || !isAuthenticated) {
    return <Loading fullScreen contextual message="Loading..." />;
  }

  if (loading) {
    return <Loading fullScreen message="Loading project..." />;
  }

  if (editId && editError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">{editError}</h3>
        <p className="text-gray-500 mb-4">Unable to load project for editing.</p>
        <button
          onClick={() => router.push('/dashboard/projects')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Back to projects
        </button>
      </div>
    );
  }

  if (editId && projectData) {
    return (
      <EntityForm
        config={projectConfig}
        initialValues={projectData}
        mode="edit"
        entityId={editId}
      />
    );
  }

  return (
    <EntityCreationWizard<ProjectData>
      config={projectConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/projects')}
    />
  );
}
