/**
 * Organizations Page - Redirect to Unified Groups
 *
 * Redirects to /groups for backward compatibility.
 * This maintains existing links while using the unified groups system.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Added redirect to unified groups page
 */

import { redirect } from 'next/navigation';

export default function OrganizationsPage() {
  redirect('/groups');
}
