/**
 * Groups List Page - Redirect to Dashboard
 *
 * Redirects to /dashboard/groups for consistency with other entity pages.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Redirect to /dashboard/groups for consistency
 */

import { redirect } from 'next/navigation';

export default function GroupsPage() {
  redirect('/dashboard/groups');
}


