/**
 * Group List Component
 *
 * Unified list component for groups (circles + organizations).
 * Uses EntityCard pattern for consistency.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created unified group list
 */

'use client';

import type { Group } from '@/services/groups/types';
import { GroupCard } from './GroupCard';

interface GroupListProps {
  groups: Group[];
  onGroupClick?: (group: Group) => void;
  emptyState?: {
    title?: string;
    description?: string;
  };
}

export function GroupList({ groups, onGroupClick, emptyState }: GroupListProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-white rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">{emptyState?.title || 'No groups yet'}</h3>
        <p className="text-muted-foreground mb-6">{emptyState?.description || 'Create your first group to get started'}</p>
        {/* Empty state action button will be handled by parent component */}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} onClick={() => onGroupClick?.(group)} />
      ))}
    </div>
  );
}


