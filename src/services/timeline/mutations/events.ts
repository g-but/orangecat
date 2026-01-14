/**
 * Timeline Event Mutations
 * 
 * Handles all write operations for timeline events (create, update, delete).
 * Single responsibility: Modify timeline data in database.
 * 
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted mutation logic from monolithic timeline service
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES, TIMELINE_TABLES } from '@/config/database-tables';
import { getTableName } from '@/config/entity-registry';
import type {
  TimelineEventResponse,
  CreateTimelineEventRequest,
  TimelineEventType,
  TimelineVisibility,
  TimelineEvent,
} from '@/types/timeline';
import { validateEventRequest } from '../processors/validation';
import { mapDbEventToTimelineEvent } from '../formatters';
import { generateProjectEventTitle, generateProjectEventDescription, shouldFeatureProjectEvent } from '../formatters/eventTitles';

/**
 * Get current user ID helper
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    logger.error('Error getting current user ID', error, 'Timeline');
    return null;
  }
}

/**
 * Handle post-creation hooks (notifications, webhooks, etc.)
 * This is a placeholder for future functionality
 */
async function handlePostCreationHooks(event: TimelineEvent): Promise<void> {
  // Placeholder for post-creation hooks
  // Could trigger notifications, webhooks, analytics, etc.
  logger.debug('Post creation hook triggered', { eventId: event.id }, 'Timeline');
}

/**
 * Create a new timeline event with visibility contexts (no duplicates)
 * This is the NEW preferred method for creating posts with cross-posting support
 */
export async function createEventWithVisibility(
  request: CreateTimelineEventRequest & {
    timelineContexts?: Array<{
      timeline_type: 'profile' | 'project' | 'community';
      timeline_owner_id: string | null;
    }>;
  }
): Promise<TimelineEventResponse> {
  try {
    // Get current user if actorId not provided
    let actorId = request.actorId;
    if (!actorId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }
      actorId = user.id;
    }

    // Validate required fields
    const validation = validateEventRequest(request);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Prepare timeline contexts as JSONB array
    const timelineContextsJson = (request.timelineContexts || []).map(ctx => ({
      timeline_type: ctx.timeline_type,
      timeline_owner_id: ctx.timeline_owner_id,
    }));

    // Ensure title is never null (DB constraint)
    const safeTitle =
      request.title?.trim() ||
      request.description?.trim()?.slice(0, 140) ||
      'Update';

    // Use database function to create post with visibility contexts
    // The function returns JSONB, so we need to parse it
    const { data, error } = await (supabase.rpc as any)('create_post_with_visibility', {
      p_event_type: request.eventType || 'post_created',
      p_actor_id: actorId,
      p_subject_type: request.subjectType || 'profile',
      p_subject_id: request.subjectId || null,
      p_title: safeTitle,
      p_description: request.description || null,
      p_visibility: request.visibility || 'public',
      p_metadata: request.metadata || {},
      p_timeline_contexts: timelineContextsJson as unknown as Record<string, unknown>, // Supabase JSONB type
    });

    if (error) {
      logger.error('Failed to create post with visibility', { error, data }, 'Timeline');

      // Provide more specific error messages
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        return {
          success: false,
          error: 'Posting feature is not available. Please contact support if this persists.',
        };
      }

      if (error.message?.includes('permission') || error.message?.includes('policy')) {
        return {
          success: false,
          error: 'You do not have permission to post here. Please check your account status.',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to create post. Please try again.',
      };
    }

    // Handle case where data might be null or undefined
    if (!data) {
      logger.error('Function returned no data', { error, request }, 'Timeline');
      return { success: false, error: 'No response from server. Please try again.' };
    }

    // Parse the JSONB response
    let result: any;
    if (typeof data === 'string') {
      try {
        result = JSON.parse(data);
      } catch (parseError) {
        logger.error('Failed to parse function response', { parseError, data }, 'Timeline');
        return { success: false, error: 'Invalid response from server. Please try again.' };
      }
    } else if (typeof data === 'object') {
      result = data;
    } else {
      logger.error('Unexpected data type from function', { data, type: typeof data }, 'Timeline');
      return { success: false, error: 'Unexpected response format. Please try again.' };
    }

    // Check if the function returned success
    if (!result || result.success === false) {
      logger.error('Function returned unsuccessful result', { result, request }, 'Timeline');
      return {
        success: false,
        error: result?.error || 'Failed to create post. Please try again.',
      };
    }

    // Extract post_id - handle both direct property and nested structure
    const postId = result.post_id || result.data?.post_id || result.id;

    if (!postId) {
      logger.error('No post_id in function response', { result }, 'Timeline');
      return { success: false, error: 'Post created but could not retrieve ID. Please refresh.' };
    }

    // Fetch the created event
    const { data: eventData, error: fetchError } = await (supabase
      .from(TIMELINE_TABLES.EVENTS) as any)
      .select('*')
      .eq('id', postId)
      .single();
    const event = eventData as any;

    if (fetchError) {
      logger.error('Failed to fetch created post', fetchError, 'Timeline');
      return { success: false, error: 'Post created but could not retrieve details' };
    }

    const timelineEvent = mapDbEventToTimelineEvent(event);

    return {
      success: true,
      event: timelineEvent,
      metadata: {
        visibility_count: result.visibility_count || 0,
      },
    };
  } catch (error: any) {
    logger.error('Error creating post with visibility', { error, request }, 'Timeline');

    // Provide more helpful error messages
    if (error?.message?.includes('function') && error?.message?.includes('does not exist')) {
      logger.warn(
        'create_post_with_visibility function not found, falling back to legacy method',
        {},
        'Timeline'
      );
      // Fallback to legacy createEvent method
      return createEvent(request);
    }

    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }

    return {
      success: false,
      error: error?.message || 'Failed to create post. Please try again.',
    };
  }
}

/**
 * Create a new timeline event (LEGACY - prefer createEventWithVisibility for posts)
 */
export async function createEvent(request: CreateTimelineEventRequest): Promise<TimelineEventResponse> {
  try {
    // Get current user if actorId not provided
    let actorId = request.actorId;
    if (!actorId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }
      actorId = user.id;
    }

    // Validate required fields based on event type
    const validation = validateEventRequest(request);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Prepare event data - match database function parameter names exactly
    const safeTitle =
      request.title?.trim() ||
      request.description?.trim()?.slice(0, 140) ||
      'Update';

    const eventData = {
      p_event_type: request.eventType || 'post_created',
      p_subject_type: request.subjectType || 'profile',
      p_title: safeTitle,
      p_event_subtype: request.eventSubtype || null,
      p_actor_id: actorId,
      p_actor_type: 'user' as const,
      p_subject_id: request.subjectId || null,
      p_target_type: request.targetType || null,
      p_target_id: request.targetId || null,
      p_description: request.description || null,
      p_content: request.content || {},
      p_amount_sats: request.amountSats || null,
      p_amount_btc: request.amountBtc || null,
      p_quantity: request.quantity || null,
      p_visibility: request.visibility || 'public',
      p_is_featured: request.isFeatured || false,
      p_metadata: request.metadata || {},
      p_tags: request.tags || [],
      p_parent_event_id: request.parentEventId || null,
      p_thread_id: request.threadId || null,
    };

    // Create event using database function
    let eventId: string;

    try {
      const { data, error } = await (supabase.rpc as any)('create_timeline_event', eventData);

      if (error) {
        logger.error('Failed to create timeline event', error, 'Timeline');
        return { success: false, error: error.message };
      }

      eventId = data;
    } catch (dbError) {
      logger.error('Failed to execute timeline creation RPC', dbError, 'Timeline');
      return { success: false, error: 'Timeline service unavailable' };
    }

    // Fetch the created event (only if database function succeeded)
    const { data: eventData2, error: fetchError } = await (supabase
      .from(TIMELINE_TABLES.EVENTS) as any)
      .select('*')
      .eq('id', eventId)
      .single();
    const event = eventData2 as any;

    if (fetchError) {
      logger.error('Failed to fetch created timeline event', fetchError, 'Timeline');
      return { success: false, error: 'Event created but could not retrieve details' };
    }

    const timelineEvent = mapDbEventToTimelineEvent(event);

    // Trigger any post-creation hooks
    await handlePostCreationHooks(timelineEvent);

    return { success: true, event: timelineEvent };
  } catch (error) {
    logger.error('Error creating timeline event', error, 'Timeline');
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Create project-related events automatically
 */
export async function createProjectEvent(
  projectId: string,
  eventType: TimelineEventType,
  userId: string,
  additionalData?: Partial<CreateTimelineEventRequest>
): Promise<TimelineEventResponse> {
  // Get project details
  const { data: projectData } = await (supabase
    .from(getTableName('project')) as any)
    .select('title, description, goal_amount, currency')
    .eq('id', projectId)
    .single();
  const project = projectData as any;

  if (!project) {
    return { success: false, error: 'Project not found' };
  }

  const title = generateProjectEventTitle(eventType, project.title, additionalData);
  const description = generateProjectEventDescription(eventType, project, additionalData);

  return createEvent({
    eventType,
    actorId: userId,
    subjectType: 'project',
    subjectId: projectId,
    title,
    description,
    visibility: 'public',
    isFeatured: shouldFeatureProjectEvent(eventType),
    metadata: {
      project_title: project.title,
      project_goal: project.goal_amount,
      project_currency: project.currency,
      ...additionalData?.metadata,
    },
    ...additionalData,
  });
}

/**
 * Create transaction-related events
 */
export async function createTransactionEvent(
  transactionId: string,
  projectId: string,
  donorId: string,
  amountSats: number,
  amountBtc: number,
  eventType: 'donation_received' | 'donation_sent' = 'donation_received'
): Promise<TimelineEventResponse> {
  // Get transaction and project details
  const { data: transactionData } = await (supabase
    .from(DATABASE_TABLES.TRANSACTIONS) as any)
    .select('*')
    .eq('id', transactionId)
    .single();
  const transaction = transactionData as any;

  const { data: projectData } = await (supabase
    .from(getTableName('project')) as any)
    .select('title')
    .eq('id', projectId)
    .single();
  const project = projectData as any;

  const { data: donorData } = await (supabase
    .from(DATABASE_TABLES.PROFILES) as any)
    .select('username, display_name')
    .eq('id', donorId)
    .single();
  const donor = donorData as any;

  if (!transaction || !project) {
    return { success: false, error: 'Transaction or project not found' };
  }

  const title =
    eventType === 'donation_received'
      ? `Received ₿${amountBtc.toFixed(6)} donation`
      : `Sent ₿${amountBtc.toFixed(6)} donation`;

  const description =
    eventType === 'donation_received'
      ? `${donor?.display_name || donor?.username || 'Anonymous'} donated ₿${amountBtc.toFixed(6)} to ${project.title}`
      : `Donated ₿${amountBtc.toFixed(6)} to ${project.title}`;

  return createEvent({
    eventType,
    actorId: donorId,
    subjectType: 'transaction',
    subjectId: transactionId,
    targetType: 'project',
    targetId: projectId,
    title,
    description,
    amountSats,
    amountBtc,
    visibility: 'public',
    metadata: {
      transaction_id: transactionId,
      project_id: projectId,
      project_title: project.title,
      donor_name: donor?.display_name || donor?.username,
      is_anonymous: !donor?.display_name && !donor?.username,
    },
  });
}

/**
 * Create a quote reply (different from quote repost)
 * Quote replies create threaded conversations for networked thoughts
 */
export async function createQuoteReply(
  parentPostId: string,
  actorId: string,
  content: string,
  quotedContent: string,
  visibility: TimelineVisibility = 'public',
  getEventById?: (eventId: string) => Promise<{ success: boolean; event?: any; error?: string }>
): Promise<TimelineEventResponse> {
  try {
    const result = await (supabase.rpc as any)('create_quote_reply', {
      p_parent_event_id: parentPostId,
      p_actor_id: actorId,
      p_content: content,
      p_quoted_content: quotedContent,
      p_visibility: visibility,
    });

    if (result.error) {
      logger.error('Failed to create quote reply', result.error, 'Timeline');
      return { success: false, error: result.error.message };
    }

    if (!result.data) {
      return { success: false, error: 'Failed to create quote reply' };
    }

    // Fetch the created event
    if (getEventById) {
      const eventResult = await getEventById(result.data);
      if (!eventResult.success || !eventResult.event) {
        return { success: false, error: 'Quote reply created but failed to fetch' };
      }
      return { success: true, event: eventResult.event };
    }

    // Fallback: fetch directly
    const { data: eventData, error: fetchError } = await (supabase
      .from(TIMELINE_TABLES.EVENTS) as any)
      .select('*')
      .eq('id', result.data)
      .single();
    const event = eventData as any;

    if (fetchError || !event) {
      return { success: false, error: 'Quote reply created but failed to fetch' };
    }

    const timelineEvent = mapDbEventToTimelineEvent(event);
    return { success: true, event: timelineEvent };
  } catch (error) {
    logger.error('Error creating quote reply', error, 'Timeline');
    return { success: false, error: 'Failed to create quote reply. Please try again.' };
  }
}

/**
 * Update event content (title, description, metadata)
 */
export async function updateEvent(
  eventId: string,
  updates: {
    title?: string;
    description?: string;
    visibility?: TimelineVisibility;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {};

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    if (updates.visibility !== undefined) {
      updateData.visibility = updates.visibility;
    }

    if (updates.metadata !== undefined) {
      updateData.metadata = updates.metadata;
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await (supabase.from(TIMELINE_TABLES.EVENTS) as any).update(updateData).eq('id', eventId);

    if (error) {
      logger.error('Failed to update timeline event', error, 'Timeline');
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error updating timeline event', error, 'Timeline');
    return { success: false, error: errorMessage };
  }
}

/**
 * Update event visibility (owner only)
 */
export async function updateEventVisibility(
  eventId: string,
  visibility: TimelineVisibility
): Promise<{ success: boolean; error?: string }> {
  return updateEvent(eventId, { visibility });
}

/**
 * Soft delete an event
 */
export async function deleteEvent(eventId: string, reason?: string): Promise<boolean> {
  try {
    const { data, error } = await (supabase.rpc as any)('soft_delete_timeline_event', {
      event_id: eventId,
      reason,
    });

    if (error) {
      logger.error('Failed to delete timeline event', error, 'Timeline');
      return false;
    }

    return data || false;
  } catch (error) {
    logger.error('Error deleting timeline event', error, 'Timeline');
    return false;
  }
}

/**
 * Share an event
 * Delegates to socialInteractions processor but handles fallback
 */
export async function shareEvent(
  originalEventId: string,
  shareText?: string,
  visibility: TimelineVisibility = 'public'
): Promise<{ success: boolean; shareCount: number; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, shareCount: 0, error: 'Authentication required' };
    }

    // Create a share event referencing the original
    const fallback = await createEvent({
      eventType: 'post_shared',
      subjectType: 'profile',
      title: 'Shared a post',
      description: shareText || 'Shared from timeline',
      metadata: { original_event_id: originalEventId },
      visibility,
    });
    
    if (!fallback.success) {
      return { success: false, shareCount: 0, error: fallback.error || 'Share failed' };
    }
    
    // Attempt to count share events referencing this original
    const { count } = await (supabase
      .from(TIMELINE_TABLES.EVENTS) as any)
      .select('id', { count: 'exact', head: true })
      .contains('metadata', { original_event_id: originalEventId });

    return { success: true, shareCount: count || 0 };
  } catch (error) {
    logger.error('Error sharing timeline event', error, 'Timeline');
    return { success: false, shareCount: 0, error: 'Internal server error' };
  }
}

