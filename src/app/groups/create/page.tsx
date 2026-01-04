/**
 * CREATE GROUP PAGE - Redirect to Dashboard
 *
 * Redirects to /dashboard/groups/create for consistency with other entity pages.
 *
 * Created: 2025-12-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Redirect to /dashboard/groups/create for consistency
 */

import { redirect } from 'next/navigation';

export default function CreateGroupPage() {
  redirect('/dashboard/groups/create');
}

