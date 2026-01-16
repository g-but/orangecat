'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import { TimelineDisplayEvent } from '@/types/timeline';

interface PostMetricsProps {
  event: TimelineDisplayEvent;
}

export function PostMetrics({ event }: PostMetricsProps) {
  // Calculate metrics
  const likesCount = event.likesCount || 0;
  const _dislikesCount = event.dislikesCount || 0;
  const commentsCount = event.commentsCount || 0;
  const repostsCount = event.repostsCount || 0;
  const sharesCount = event.sharesCount || 0;
  const viewsCount = (event.metadata?.views_count as number) || 0;

  // Format large numbers
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Build engagement text
  const engagementParts: string[] = [];

  if (likesCount > 0) {
    engagementParts.push(`${formatCount(likesCount)} Like${likesCount !== 1 ? 's' : ''}`);
  }

  if (repostsCount > 0) {
    engagementParts.push(`${formatCount(repostsCount)} Repost${repostsCount !== 1 ? 's' : ''}`);
  }

  if (sharesCount > 0) {
    engagementParts.push(`${formatCount(sharesCount)} Share${sharesCount !== 1 ? 's' : ''}`);
  }

  if (commentsCount > 0) {
    engagementParts.push(`${formatCount(commentsCount)} Comment${commentsCount !== 1 ? 's' : ''}`);
  }

  return (
    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
      {/* Engagement Summary */}
      {engagementParts.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {engagementParts.slice(0, 3).map((part, index) => (
            <span key={index} className="hover:underline cursor-pointer">
              {part}
            </span>
          ))}
        </div>
      )}

      {/* View Count */}
      {viewsCount > 0 && (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Eye className="w-4 h-4" />
          <span>{formatCount(viewsCount)}</span>
        </div>
      )}

      {/* Placeholder for additional metrics */}
      {/* TODO: Add bookmark count, quote count, etc. */}
    </div>
  );
}



