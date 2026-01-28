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
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use shared useCreatePrefill hook (DRY)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCreatePrefill } from '@/hooks/useCreatePrefill';
import { EntityCreationWizard } from '@/components/create';
import { projectConfig } from '@/config/entity-configs/project-config';
import Loading from '@/components/Loading';
import type { ProjectData } from '@/lib/validation';

export default function CreateProjectPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useRequireAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Use shared prefill hook (DRY - replaces duplicated prefill logic)
  const { initialData } = useCreatePrefill<ProjectData>({
    entityType: 'project',
    enabled: isAuthenticated,
  });

  // Redirect if not authenticated (backup check)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasRedirected) {
      setHasRedirected(true);
      router.push('/auth?mode=login&from=/dashboard/projects/create');
    }
  }, [isLoading, isAuthenticated, router, hasRedirected]);

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
