/**
 * ProjectUpdatesTimeline Component
 *
 * Shows recent project updates, donations, and activity
 * Builds trust through transparency and demonstrates active engagement
 *
 * Created: 2025-11-17
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Activity, Bitcoin, MessageSquare, Trophy, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '@/utils/logger';

interface ProjectUpdate {
  id: string;
  project_id: string;
  type: 'update' | 'donation' | 'milestone';
  title: string;
  content?: string;
  amount_btc?: number;
  created_at: string;
}

interface ProjectUpdatesTimelineProps {
  projectId: string;
  className?: string;
}

export function ProjectUpdatesTimeline({ projectId, className = '' }: ProjectUpdatesTimelineProps) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/updates`);

        if (response.ok) {
          const data = await response.json();
          setUpdates(data.updates || []);
        } else {
          logger.warn('Failed to fetch project updates', { projectId }, 'ProjectUpdatesTimeline');
          setUpdates([]);
        }
      } catch (error) {
        logger.error('Error fetching project updates', { projectId, error }, 'ProjectUpdatesTimeline');
        setUpdates([]);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchUpdates();
    }
  }, [projectId]);

  // Get icon based on update type
  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'donation':
        return <Bitcoin className="w-4 h-4 text-orange-600" />;
      case 'milestone':
        return <Trophy className="w-4 h-4 text-yellow-600" />;
      case 'update':
      default:
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
    }
  };

  // Get background color based on type
  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'donation':
        return 'bg-orange-100';
      case 'milestone':
        return 'bg-yellow-100';
      case 'update':
      default:
        return 'bg-blue-100';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gray-400 animate-pulse" />
            <h3 className="text-lg font-semibold text-gray-400">Loading activity...</h3>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 pb-4 border-b animate-pulse">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-600" />
          Recent Activity
        </h3>

        {updates.length > 0 ? (
          <div className="space-y-4">
            {updates.map((update) => (
              <div key={update.id} className="flex gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                {/* Icon based on type */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full ${getBackgroundColor(update.type)} flex items-center justify-center`}
                >
                  {getUpdateIcon(update.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900">{update.title}</p>
                    {update.amount_btc && (
                      <span className="text-sm font-semibold text-orange-600 flex-shrink-0">
                        {update.amount_btc.toFixed(8)} BTC
                      </span>
                    )}
                  </div>
                  {update.content && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{update.content}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-1">No recent activity yet</p>
            <p className="text-xs text-gray-400">Updates will appear here as the project progresses</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
