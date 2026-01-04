/**
 * Organization Detail Page - Redirect to Unified Groups
 *
 * Redirects to /groups/[slug] for backward compatibility.
 * Organizations and circles now use the unified groups system.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Added redirect to unified groups detail page
 */

import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  // Redirect to unified groups route
  redirect(`/groups/${slug}`);
}
