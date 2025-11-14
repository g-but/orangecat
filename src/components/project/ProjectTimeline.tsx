'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { timelineService } from '@/services/timeline';
import TimelineComponent from '@/components/timeline/TimelineComponent';
import TimelineComposer from '@/components/timeline/TimelineComposer';
import { Card, CardContent } from '@/components/ui/Card';
import { Activity, AlertCircle, Loader } from 'lucide-react';
import { logger } from '@/utils/logger';

interface ProjectTimelineProps {
  projectId: string;
  projectTitle: string;
  isOwner: boolean;
}

/**
 * ProjectTimeline Component
 *
 * Displays timeline posts associated with a specific project.
 * Allows project owners and visitors to post updates related to the project.
 */
export default function ProjectTimeline({
  projectId,
  projectTitle,
  isOwner,
}: ProjectTimelineProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  // Load project timeline
  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch events for this specific project using the dedicated method
      const projectEvents = await timelineService.getProjectTimeline(projectId, 50);

      setEvents(projectEvents);
    } catch (err) {
      logger.error('Failed to load project timeline', err, 'ProjectTimeline');
      setError('Failed to load project timeline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTimeline();
  }, [projectId]);

  // Handle event updates (likes, comments, etc.)
  const handleEventUpdate = (eventId: string, updates: Partial<any>) => {
    setEvents(prevEvents =>
      prevEvents.map(event => (event.id === eventId ? { ...event, ...updates } : event))
    );
  };

  // Handle event deletion
  const handleEventDelete = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
  };

  // Handle post created
  const handlePostCreated = () => {
    setShowComposer(false);
    loadTimeline(); // Reload to show new post
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-orange-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Updates</h2>
            <p className="text-sm text-gray-600">Updates and discussions about {projectTitle}</p>
          </div>
        </div>

        {user && (
          <button
            onClick={() => setShowComposer(!showComposer)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-full font-semibold transition-all shadow-sm hover:shadow-md"
          >
            {showComposer ? 'Cancel' : 'Post Update'}
          </button>
        )}
      </div>

      {/* Post Composer */}
      {showComposer && user && (
        <TimelineComposer
          targetOwnerId={projectId}
          targetOwnerType="project"
          targetOwnerName={projectTitle}
          onPostCreated={handlePostCreated}
          onCancel={() => setShowComposer(false)}
          placeholder={`Share an update about ${projectTitle}...`}
          buttonText="Post Update"
          showBanner={false}
        />
      )}

      {/* Info Card for non-authenticated users */}
      {!user && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">
              <strong>Want to post updates?</strong> Sign in to share updates about this project.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-orange-500 animate-spin" />
          <span className="ml-3 text-gray-600">Loading updates...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error loading timeline</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={loadTimeline}
                className="mt-2 text-sm text-red-700 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Events */}
      {!loading && !error && events.length > 0 && (
        <div className="space-y-4">
          {events.map(event => (
            <TimelineComponent
              key={event.id}
              event={event}
              onUpdate={updates => handleEventUpdate(event.id, updates)}
              onDelete={() => handleEventDelete(event.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No updates yet</h3>
            <p className="text-gray-600 mb-4">
              Be the first to share an update about this project!
            </p>
            {user && !showComposer && (
              <button
                onClick={() => setShowComposer(true)}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-full font-semibold transition-all shadow-sm hover:shadow-md"
              >
                Post First Update
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
