'use client';

/**
 * CREATE PROJECT PAGE
 *
 * Uses the generic EntityCreationWizard for progressive disclosure and improved UX.
 * 4-step guided flow: Template → Basic Info → Funding Details → Additional Options
 *
 * Supports prefill from:
 * - URL params: /dashboard/projects/create?title=...&description=...
 * - localStorage: project_prefill (legacy)
 *
 * Created: 2025-12-03
 * Last Modified: 2026-01-22
 * Last Modified Summary: Migrated to generic EntityCreationWizard (DRY principle)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { EntityCreationWizard } from '@/components/create';
import { projectConfig } from '@/config/entity-configs/project-config';
import Loading from '@/components/Loading';
import type { ProjectData } from '@/lib/validation';

export default function CreateProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, isAuthenticated } = useRequireAuth();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [initialData, setInitialData] = useState<Partial<ProjectData> | undefined>(undefined);

  // Redirect if not authenticated (backup check)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasRedirected) {
      setHasRedirected(true);
      router.push('/auth?mode=login&from=/dashboard/projects/create');
    }
  }, [isLoading, isAuthenticated, router, hasRedirected]);

  // Prefill support - URL params take priority, then localStorage
  useEffect(() => {
    // Only run when authenticated
    if (!isAuthenticated) {
      return;
    }

    // Check URL params first (from My Cat action buttons)
    const title = searchParams?.get('title');
    const description = searchParams?.get('description');
    const category = searchParams?.get('category');

    if (title || description) {
      const prefillData: Partial<ProjectData> = {};
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
      return;
    }

    // Fall back to localStorage (legacy support)
    try {
      const raw = localStorage.getItem('project_prefill');
      if (raw) {
        const data = JSON.parse(raw);
        setInitialData(data);
        localStorage.removeItem('project_prefill');
      }
    } catch {
      // Ignore parse errors
    }
  }, [isAuthenticated, searchParams]);

  // Show loading while checking auth
  if (isLoading || !isAuthenticated) {
    return <Loading fullScreen contextual message="Loading..." />;
  }

  return (
    <EntityCreationWizard<ProjectData>
      config={projectConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/projects')}
    />
  );
}
