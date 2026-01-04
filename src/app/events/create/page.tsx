import { redirect } from 'next/navigation';

/**
 * CREATE EVENT PAGE (Redirect)
 *
 * Redirects to the new dashboard location for consistency.
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-30
 * Last Modified Summary: Added redirect to /dashboard/events/create
 */
export default function CreateEventPage() {
  redirect('/dashboard/events/create');
}

