/**
 * Timeline Event Validation
 * 
 * Validates timeline event creation requests.
 * 
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted validation logic from monolithic timeline service
 */

import type { CreateTimelineEventRequest, TimelineEventType } from '@/types/timeline';

/**
 * Validate event creation request
 */
export function validateEventRequest(request: CreateTimelineEventRequest): {
  valid: boolean;
  error?: string;
} {
  const hasTitle = !!request.title?.trim();
  const isStatusUpdate = request.eventType === 'status_update';
  const isRepost =
    !!request.metadata?.is_repost ||
    !!request.metadata?.is_quote_repost ||
    !!request.parentEventId;

  if (!hasTitle && !(isStatusUpdate || isRepost)) {
    return { valid: false, error: 'Title is required' };
  }

  // Add more validation based on event type
  switch (request.eventType) {
    case 'donation_received':
    case 'donation_sent':
      if (!request.amountSats || request.amountSats <= 0) {
        return { valid: false, error: 'Valid donation amount required' };
      }
      break;
    case 'project_created':
    case 'project_published':
      if (!request.subjectId) {
        return { valid: false, error: 'Project ID required for project events' };
      }
      break;
  }

  return { valid: true };
}



