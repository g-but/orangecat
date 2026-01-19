'use client';

/**
 * CREATE PROJECT PAGE
 *
 * Uses the new ProjectCreationWizard for progressive disclosure and improved UX.
 * 4-step guided flow: Template → Basic Info → Funding Details → Advanced Options
 *
 * Created: 2025-12-03
 * Last Modified: 2026-01-16
 * Last Modified Summary: Added auth protection to prevent unauthorized access
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { ProjectCreationWizard } from '@/components/create/ProjectCreationWizard';
import Loading from '@/components/Loading';

export default function CreateProjectPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useRequireAuth();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [initialData, setInitialData] = useState<Record<string, unknown> | undefined>(undefined);

  // Redirect if not authenticated (backup check)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasRedirected) {
      setHasRedirected(true);
      router.push('/auth?mode=login&from=/dashboard/projects/create');
    }
  }, [isLoading, isAuthenticated, router, hasRedirected]);

  // Prefill support from My Cat (project_prefill) - must be before conditional return
  useEffect(() => {
    // Only run when authenticated
    if (!isAuthenticated) {
      return;
    }

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
  }, [isAuthenticated]);

  // Show loading while checking auth
  if (isLoading || !isAuthenticated) {
    return <Loading fullScreen contextual message="Loading..." />;
  }

  return <ProjectCreationWizard initialData={initialData} />;
}
