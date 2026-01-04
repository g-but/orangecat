/**
 * CREATE ORGANIZATION PAGE
 *
 * Organizations are now unified as groups.
 * Redirects to groups creation page.
 *
 * Created: 2025-12-06
 * Last Modified: 2025-01-30
 * Last Modified Summary: Redirect to groups (organizations are now groups)
 */

import { redirect } from 'next/navigation';

export default function CreateOrganizationPage() {
  redirect('/dashboard/groups/create');
}

