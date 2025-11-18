'use client';

import React, { useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Activity } from 'lucide-react';
import UnifiedPostComposer from '@/components/timeline/UnifiedPostComposer';
import TimelineView from '@/components/timeline/TimelineView';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ProjectTimelineProps {
  projectId: string;
  projectTitle: string;
  isOwner: boolean;
}

export default function ProjectTimeline({
  projectId,
  projectTitle,
  isOwner,
}: ProjectTimelineProps) {
  const { user } = useAuth();
  const [showComposer, setShowComposer] = useState(false);
  const [timelineKey, setTimelineKey] = useState(0);

  const refreshTimeline = useCallback(() => {
    setTimelineKey(prev => prev + 1);
  }, []);

  const handlePostCreated = useCallback(() => {
    setShowComposer(false);
    refreshTimeline();
  }, [refreshTimeline]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-orange-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Updates</h2>
            <p className="text-sm text-gray-600">Insights and progress for {projectTitle}</p>
          </div>
        </div>
        {user && (
          <Button
            size="sm"
            variant={showComposer ? 'ghost' : 'secondary'}
            className="transition-all"
            onClick={() => setShowComposer(prev => !prev)}
          >
            {showComposer ? 'Cancel' : 'Post Update'}
          </Button>
        )}
      </div>

      {showComposer && user && (
        <UnifiedPostComposer
          mode="full"
          subjectId={projectId}
          subjectType="project"
          onPostCreated={handlePostCreated}
          onCancel={() => setShowComposer(false)}
          placeholder={`Share an update about ${projectTitle}...`}
          buttonText="Post Update"
          showBanner={false}
          showVisibilityToggle={true}
          showProjectSelection={false}
        />
      )}

      {!user && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">
              <strong>Want to post updates?</strong> Sign in to share progress about this project.
            </p>
          </CardContent>
        </Card>
      )}

      <TimelineView
        key={`project-timeline-${timelineKey}`}
        feedType="project"
        ownerId={projectId}
        ownerType="project"
        showComposer={false}
        compact={false}
        showFilters={false}
        emptyStateTitle="No updates yet"
        emptyStateDescription="Be the first to share a progress update."
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
