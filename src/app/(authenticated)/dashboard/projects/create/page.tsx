'use client';

/**
 * CREATE PROJECT PAGE
 *
 * Uses the new ProjectCreationWizard for progressive disclosure and improved UX.
 * 4-step guided flow: Template → Basic Info → Funding Details → Advanced Options
 *
 * Created: 2025-12-03
 * Last Modified: 2026-01-16
 * Last Modified Summary: Updated to use ProjectCreationWizard for better UX
 */

import { ProjectCreationWizard } from '@/components/create/ProjectCreationWizard';

export default function CreateProjectPage() {
  return <ProjectCreationWizard />;
}
