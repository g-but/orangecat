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
import { STATUS } from '@/config/database-constants';
import { TABLES } from '../constants';
import type {
  CreateEventInput,
  UpdateEventInput,
  RsvpStatus,
  EventResponse,
  RsvpResponse,
} from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

/**
 * Create a new event for a group
 */
export async function createEvent(
  input: CreateEventInput,
  client?: AnySupabaseClient
): Promise<EventResponse> {
  try {
    const sb = client || supabase;
    const userId = await getCurrentUserId(sb);
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check membership
    const isMember = await isGroupMember(input.group_id, userId, sb);
    if (!isMember) {
      return { success: false, error: 'Only group members can create events' };
    }

    // Validate required fields
    if (!input.title || !input.starts_at) {
      return { success: false, error: 'Title and start time are required' };
    }

    // Create event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eventData, error } = await (
      sb
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.group_events) as any
    )
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      },
      sb
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
  input: UpdateEventInput,
  client?: AnySupabaseClient
): Promise<EventResponse> {
  try {
    const sb = client || supabase;
    const userId = await getCurrentUserId(sb);
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get event to check permissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eventData, error: fetchError } = await (
      sb
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.group_events) as any
    )
      .select('id, group_id, creator_id')
      .eq('id', eventId)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = eventData as any;

    if (fetchError || !event) {
      return { success: false, error: 'Event not found' };
    }

    // Check if user is creator or admin
    const role = await getUserRole(event.group_id, userId, sb);
    const isCreator = event.creator_id === userId;
    const isAdmin = role === STATUS.GROUP_MEMBERS.ADMIN || role === STATUS.GROUP_MEMBERS.FOUNDER;

    if (!isCreator && !isAdmin) {
      return {
        success: false,
        error: 'Only event creator or group admins can update events',
      };
    }

    // Update event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedData, error } = await (
      sb
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.group_events) as any
    )
      .update(input)
      .eq('id', eventId)
      .select()
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      },
      sb
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
  eventId: string,
  client?: AnySupabaseClient
): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = client || supabase;
    const userId = await getCurrentUserId(sb);
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get event to check permissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eventData2, error: fetchError } = await (
      sb
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.group_events) as any
    )
      .select('id, group_id, creator_id, title')
      .eq('id', eventId)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = eventData2 as any;

    if (fetchError || !event) {
      return { success: false, error: 'Event not found' };
    }

    // Check if user is creator or admin
    const role = await getUserRole(event.group_id, userId, sb);
    const isCreator = event.creator_id === userId;
    const isAdmin = role === STATUS.GROUP_MEMBERS.ADMIN || role === STATUS.GROUP_MEMBERS.FOUNDER;

    if (!isCreator && !isAdmin) {
      return {
        success: false,
        error: 'Only event creator or group admins can delete events',
      };
    }

    // Delete event (RSVPs will be cascade deleted)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (
      sb
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.group_events) as any
    )
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
      },
      sb
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
  status: RsvpStatus,
  client?: AnySupabaseClient
): Promise<RsvpResponse> {
  try {
    const sb = client || supabase;
    const userId = await getCurrentUserId(sb);
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get event to verify it exists and is accessible
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eventData3, error: fetchError } = await (
      sb
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.group_events) as any
    )
      .select('id, group_id, is_public, requires_rsvp')
      .eq('id', eventId)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = eventData3 as any;

    if (fetchError || !event) {
      return { success: false, error: 'Event not found' };
    }

    // Check if user can see the event (public or member)
    const isMember = await isGroupMember(event.group_id, userId, sb);
    if (!event.is_public && !isMember) {
      return { success: false, error: 'You do not have access to this event' };
    }

    // Upsert RSVP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rsvpData, error } = await (
      sb
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.group_event_rsvps) as any
    )
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      },
      sb
    );

    return { success: true, rsvp: data };
  } catch (error) {
    logger.error('Exception RSVPing to event', error, 'Groups');
    return { success: false, error: 'Failed to RSVP to event' };
  }
}
