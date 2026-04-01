/**
 * Groups Events Mutation Functions
 *
 * Handles event creation, updates, deletion, and RSVP operations.
 *
 * Created: 2025-12-30
 * Last Modified: 2026-03-31
 * Last Modified Summary: Consolidate as-any casts into db-helpers
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { getCurrentUserId, isGroupMember, getUserRole } from '../utils/helpers';
import { logGroupActivity } from '../utils/activity';
import { STATUS } from '@/config/database-constants';
import { TABLES } from '../constants';
import { fromTable, type AnySupabaseClient } from '../db-helpers';
import type {
  CreateEventInput,
  UpdateEventInput,
  RsvpStatus,
  EventResponse,
  RsvpResponse,
  GroupEvent,
  EventRsvp,
} from '../types';

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
    const { data, error } = await fromTable(sb, TABLES.group_events)
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

    if (error) {
      logger.error('Failed to create event', error, 'Groups');
      return { success: false, error: error.message };
    }

    const event = data as GroupEvent;

    // Log activity
    await logGroupActivity(
      input.group_id,
      userId,
      'created_event',
      `Created event: ${event.title}`,
      {
        event_id: event.id,
        event_title: event.title,
      },
      sb
    );

    return { success: true, event };
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
    const { data: existing, error: fetchError } = await fromTable(sb, TABLES.group_events)
      .select('id, group_id, creator_id')
      .eq('id', eventId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'Event not found' };
    }

    const event = existing as { id: string; group_id: string; creator_id: string };

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
    const { data: updated, error } = await fromTable(sb, TABLES.group_events)
      .update(input)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update event', error, 'Groups');
      return { success: false, error: error.message };
    }

    const updatedEvent = updated as GroupEvent;

    // Log activity
    await logGroupActivity(
      event.group_id,
      userId,
      'updated_event',
      `Updated event: ${updatedEvent.title}`,
      {
        event_id: eventId,
        event_title: updatedEvent.title,
      },
      sb
    );

    return { success: true, event: updatedEvent };
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
    const { data: existing, error: fetchError } = await fromTable(sb, TABLES.group_events)
      .select('id, group_id, creator_id, title')
      .eq('id', eventId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'Event not found' };
    }

    const event = existing as { id: string; group_id: string; creator_id: string; title: string };

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
    const { error } = await fromTable(sb, TABLES.group_events).delete().eq('id', eventId);

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
    const { data: existing, error: fetchError } = await fromTable(sb, TABLES.group_events)
      .select('id, group_id, is_public, requires_rsvp')
      .eq('id', eventId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'Event not found' };
    }

    const event = existing as {
      id: string;
      group_id: string;
      is_public: boolean;
      requires_rsvp: boolean;
    };

    // Check if user can see the event (public or member)
    const isMember = await isGroupMember(event.group_id, userId, sb);
    if (!event.is_public && !isMember) {
      return { success: false, error: 'You do not have access to this event' };
    }

    // Upsert RSVP
    const { data: rsvpData, error } = await fromTable(sb, TABLES.group_event_rsvps)
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

    if (error) {
      logger.error('Failed to RSVP to event', error, 'Groups');
      return { success: false, error: error.message };
    }

    const rsvp = rsvpData as EventRsvp;

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

    return { success: true, rsvp };
  } catch (error) {
    logger.error('Exception RSVPing to event', error, 'Groups');
    return { success: false, error: 'Failed to RSVP to event' };
  }
}
