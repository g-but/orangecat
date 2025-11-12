import { redirect } from 'next/navigation';

/**
 * Projects List Page
 *
 * Redirects to the discover page with projects section
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created redirect page for /projects route
 */
export default function ProjectsListPage() {
  redirect('/discover?section=projects');
}
