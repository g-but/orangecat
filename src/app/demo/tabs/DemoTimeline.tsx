'use client';

/**
 * DEMO TIMELINE TAB
 *
 * Shows social timeline with community engagement.
 */

import { MessageCircle, Heart, Share2, Bitcoin } from 'lucide-react';
import { type DemoTimelineEvent, formatSats } from '@/data/demo';

interface DemoTimelineProps {
  timeline: DemoTimelineEvent[];
}

export function DemoTimeline({ timeline }: DemoTimelineProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Community Timeline</h2>
          <p className="text-gray-600">Stay connected with the Bitcoin community</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <MessageCircle className="w-4 h-4" />
          Post Update
        </button>
      </div>

      {/* Timeline Events */}
      <div className="space-y-6">
        {timeline.map(event => (
          <TimelineEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

interface TimelineEventCardProps {
  event: DemoTimelineEvent;
}

function TimelineEventCard({ event }: TimelineEventCardProps) {
  return (
    <div className="bg-white rounded-lg border p-4 md:p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="text-2xl flex-shrink-0">{event.actorAvatar}</span>
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-semibold">{event.actor}</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">{event.timestamp}</span>
            {event.circle && (
              <>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-blue-600">{event.circle}</span>
              </>
            )}
          </div>

          {/* Content */}
          <p className="text-gray-900 mb-3">{event.content}</p>

          {/* Amount Badge */}
          {event.amount && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3 inline-block">
              <div className="flex items-center gap-2">
                <Bitcoin className="w-4 h-4 text-orange-600" />
                <span className="font-semibold text-orange-800">{formatSats(event.amount)}</span>
                <span className="text-orange-600">funded</span>
              </div>
            </div>
          )}

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {event.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Social Actions */}
          <div className="flex items-center gap-6 pt-3 border-t">
            <button className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{event.likes}</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{event.comments}</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-sm">{event.shares}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
