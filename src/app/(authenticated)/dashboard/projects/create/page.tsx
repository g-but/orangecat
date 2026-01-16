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

  return <ProjectCreationWizard />;
}
