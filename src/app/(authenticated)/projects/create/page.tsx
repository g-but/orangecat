/**
 * Legacy Project Create Page - Redirects to new path
 *
 * Preserves backward compatibility by redirecting to the new dashboard path.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-31
 * Last Modified Summary: Converted to redirect to /dashboard/projects/create
 */

import { redirect } from 'next/navigation';
import { ROUTES } from '@/config/routes';

export default function LegacyCreateProjectPage() {
  redirect(ROUTES.DASHBOARD.PROJECTS_CREATE);
}
