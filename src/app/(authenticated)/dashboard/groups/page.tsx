/**
 * Groups List Page
 *
 * Unified groups dashboard (replaces circles and organizations list pages).
 * Uses GroupsDashboard component.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Moved to /dashboard/groups for consistency, uses EntityListShell
 */

'use client';

import { GroupsDashboard } from '@/components/groups/GroupsDashboard';

export default function GroupsPage() {
  return <GroupsDashboard />;
}
