/**
 * Group Detail Page
 *
 * Displays detailed information about a specific group.
 * Uses GroupDetail component.
 *
 * Created: 2025-12-31
 * Last Modified: 2025-12-31
 * Last Modified Summary: Created group detail page route
 */

'use client';

import { useParams } from 'next/navigation';
import { GroupDetail } from '@/components/groups/GroupDetail';

export default function GroupDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  if (!slug) {
    return <div>Loading...</div>;
  }
  
  return <GroupDetail groupSlug={slug} />;
}
