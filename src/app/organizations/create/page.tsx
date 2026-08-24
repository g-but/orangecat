/**
 * CREATE ORGANIZATION PAGE - Redirect to Dashboard
 *
 * Redirects to /dashboard/organizations/create for consistency with other entity pages.
 *
 * Created: 2025-12-30
 * Last Modified: 2026-08-20
 * Last Modified Summary: Paths use organizations (EntityType rename from group).
 */

import { redirect } from 'next/navigation';
import { ROUTES } from '@/config/routes';

export default function CreateOrganizationPage() {
  redirect(ROUTES.DASHBOARD.GROUPS_CREATE);
}
