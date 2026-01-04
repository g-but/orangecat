/**
 * Legacy Asset Create Page - Redirects to new path
 *
 * Preserves backward compatibility by redirecting to the new dashboard path.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-31
 * Last Modified Summary: Converted to redirect to /dashboard/assets/create
 */

import { redirect } from 'next/navigation';

export default function LegacyCreateAssetPage() {
  redirect('/dashboard/assets/create');
}
