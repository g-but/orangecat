/**
 * Event Title and Description Generators
 * 
 * Generates human-readable titles and descriptions for timeline events.
 * 
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted title generation logic from monolithic timeline service
 */

import type { TimelineEventType } from '@/types/timeline';

/**
 * Generate project event title
 */
export function generateProjectEventTitle(
  eventType: TimelineEventType,
  projectTitle: string,
  _additionalData?: unknown
): string {
  switch (eventType) {
    case 'project_created':
      return `Created project "${projectTitle}"`;
    case 'project_published':
      return `Published project "${projectTitle}"`;
    case 'project_completed':
      return `Completed project "${projectTitle}"`;
    case 'project_goal_reached':
      return `Reached funding goal for "${projectTitle}"`;
    case 'project_funded':
      return `Received funding for "${projectTitle}"`;
    default:
      return `${eventType.replace('_', ' ')} for "${projectTitle}"`;
  }
}

/**
 * Generate project event description
 */
export function generateProjectEventDescription(
  eventType: TimelineEventType,
  project: { title: string; goal_amount?: number; currency?: string },
  _additionalData?: unknown
): string {
  switch (eventType) {
    case 'project_created':
      return `Started working on "${project.title}" with a goal of ${project.goal_amount || 0} ${project.currency || 'sats'}`;
    case 'project_published':
      return `"${project.title}" is now live and accepting donations`;
    case 'project_completed':
      return `Successfully completed "${project.title}"`;
    case 'project_goal_reached':
      return `"${project.title}" has reached its funding goal!`;
    default:
      return `Project "${project.title}" milestone achieved`;
  }
}

/**
 * Check if project event should be featured
 */
export function shouldFeatureProjectEvent(eventType: TimelineEventType): boolean {
  return [
    'project_created',
    'project_published',
    'project_completed',
    'project_goal_reached',
  ].includes(eventType);
}



