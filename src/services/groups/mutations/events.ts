/**
 * Groups Events Mutation Functions
 *
 * Handles event creation, updates, deletion, and RSVP operations.
 *
 * Created: 2025-12-30
 * Last Modified: 2025-12-30
 * Last Modified Summary: Initial implementation
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { getCurrentUserId, isGroupMember, getUserRole } from '../utils/helpers';
import { logGroupActivity } from '../utils/activity';
import { TABLES } from '../constants';
import type {
  CreateEventInput,
  UpdateEventInput,
  RsvpStatus,
  EventResponse,
  RsvpResponse,
} from '../types';

/**
 * Create a new event for a group
 */
export async function createEvent(
  input: CreateEventInput
): Promise<EventResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check membership
    const isMember = await isGroupMember(input.group_id, userId);
    if (!isMember) {
      return { success: false, error: 'Only group members can create events' };
    }

    // Validate required fields
    if (!input.title || !input.starts_at) {
      return { success: false, error: 'Title and start time are required' };
    }

    // Create event
    const { data: eventData, error } = await (supabase
      .from(TABLES.group_events) as any)
      .insert({
        ...input,
        creator_id: userId,
        timezone: input.timezone || 'UTC',
        event_type: input.event_type || 'general',
        location_type: input.location_type || 'online',
        is_public: input.is_public ?? true,
        requires_rsvp: input.requires_rsvp ?? false,
      })
      .select()
      .single();
    const data = eventData as any;

    if (error) {
      logger.error('Failed to create event', error, 'Groups');
      return { success: false, error: error.message };
    }

    // Log activity
    await logGroupActivity(
      input.group_id,
      userId,
      'created_event',
      `Created event: ${data.title}`,
      {
        event_id: data.id,
        event_title: data.title,
      }
    );

    return { success: true, event: data };
  } catch (error) {
    logger.error('Exception creating event', error, 'Groups');
    return { success: false, error: 'Failed to create event' };
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  input: UpdateEventInput
): Promise<EventResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get event to check permissions
    const { data: eventData, error: fetchError } = await (supabase
      .from(TABLES.group_events) as any)
      .select('id, group_id, creator_id')
      .eq('id', eventId)
      .single();
    const event = eventData as any;

    if (fetchError || !event) {
      return { success: false, error: 'Event not found' };
    }

    // Check if user is creator or admin
    const role = await getUserRole(event.group_id, userId);
    const isCreator = event.creator_id === userId;
    const isAdmin = role === 'admin' || role === 'founder';

    if (!isCreator && !isAdmin) {
      return {
        success: false,
        error: 'Only event creator or group admins can update events',
      };
    }

    // Update event
    const { data: updatedData, error } = await (supabase
      .from(TABLES.group_events) as any)
      .update(input)
      .eq('id', eventId)
      .select()
      .single();
    const data = updatedData as any;

    if (error) {
      logger.error('Failed to update event', error, 'Groups');
      return { success: false, error: error.message };
    }

    // Log activity
    await logGroupActivity(
      event.group_id,
      userId,
      'updated_event',
      `Updated event: ${data.title}`,
      {
        event_id: eventId,
        event_title: data.title,
      }
    );

    return { success: true, event: data };
  } catch (error) {
    logger.error('Exception updating event', error, 'Groups');
    return { success: false, error: 'Failed to update event' };
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get event to check permissions
    const { data: eventData2, error: fetchError } = await (supabase
      .from(TABLES.group_events) as any)
      .select('id, group_id, creator_id, title')
      .eq('id', eventId)
      .single();
    const event = eventData2 as any;

    if (fetchError || !event) {
      return { success: false, error: 'Event not found' };
    }

    // Check if user is creator or admin
    const role = await getUserRole(event.group_id, userId);
    const isCreator = event.creator_id === userId;
    const isAdmin = role === 'admin' || role === 'founder';

    if (!isCreator && !isAdmin) {
      return {
        success: false,
        error: 'Only event creator or group admins can delete events',
      };
    }

    // Delete event (RSVPs will be cascade deleted)
    const { error } = await (supabase
      .from(TABLES.group_events) as any)
      .delete()
      .eq('id', eventId);

    if (error) {
      logger.error('Failed to delete event', error, 'Groups');
      return { success: false, error: error.message };
    }

    // Log activity
    await logGroupActivity(
      event.group_id,
      userId,
      'deleted_event',
      `Deleted event: ${event.title}`,
      {
        event_id: eventId,
        event_title: event.title,
      }
    );

    return { success: true };
  } catch (error) {
    logger.error('Exception deleting event', error, 'Groups');
    return { success: false, error: 'Failed to delete event' };
  }
}

/**
 * RSVP to an event
 */
export async function rsvpToEvent(
  eventId: string,
  status: RsvpStatus
): Promise<RsvpResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get event to verify it exists and is accessible
    const { data: eventData3, error: fetchError } = await (supabase
      .from(TABLES.group_events) as any)
      .select('id, group_id, is_public, requires_rsvp')
      .eq('id', eventId)
      .single();
    const event = eventData3 as any;

    if (fetchError || !event) {
      return { success: false, error: 'Event not found' };
    }

    // Check if user can see the event (public or member)
    const isMember = await isGroupMember(event.group_id, userId);
    if (!event.is_public && !isMember) {
      return { success: false, error: 'You do not have access to this event' };
    }

    // Upsert RSVP
    const { data: rsvpData, error } = await (supabase
      .from(TABLES.group_event_rsvps) as any)
      .upsert(
        {
          event_id: eventId,
          user_id: userId,
          status,
        },
        {
          onConflict: 'event_id,user_id',
        }
      )
      .select()
      .single();
    const data = rsvpData as any;

    if (error) {
      logger.error('Failed to RSVP to event', error, 'Groups');
      return { success: false, error: error.message };
    }

    // Log activity
    await logGroupActivity(
      event.group_id,
      userId,
      'rsvp_to_event',
      `RSVP to event: ${status}`,
      {
        event_id: eventId,
        rsvp_status: status,
      }
    );

    return { success: true, rsvp: data };
  } catch (error) {
    logger.error('Exception RSVPing to event', error, 'Groups');
    return { success: false, error: 'Failed to RSVP to event' };
  }
}

