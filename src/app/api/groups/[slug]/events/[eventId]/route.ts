/**
 * Individual Event API
 *
 * Handles individual event operations.
 *
 * GET /api/groups/[slug]/events/[eventId] - Get event details
 * PUT /api/groups/[slug]/events/[eventId] - Update event (creator/admin)
 * DELETE /api/groups/[slug]/events/[eventId] - Delete event (creator/admin)
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { z } from 'zod';

// Validation schema for updating events
const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  event_type: z.enum(['general', 'meeting', 'celebration', 'assembly']).optional(),
  location_type: z.enum(['online', 'in_person', 'hybrid']).optional(),
  location_details: z.string().max(500).optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  timezone: z.string().optional(),
  max_attendees: z.number().int().positive().optional(),
  is_public: z.boolean().optional(),
  requires_rsvp: z.boolean().optional(),
});

/**
 * GET /api/groups/[slug]/events/[eventId]
 * Get event details
 */
export const GET = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ slug: string; eventId: string }> }
) => {
  try {
    const { slug, eventId } = await params;
    const { user } = req;
    const supabase = await createServerClient();

    // Get group by slug
    const { data: group, error: groupError } = await (supabase
      .from('groups') as any)
      .select('id')
      .eq('slug', slug)
      .single();

    if (groupError || !group) {
      return apiNotFound('Group not found');
    }

    // Get event
    const { data: event, error: eventError } = await (supabase
      .from('group_events') as any)
      .select(
        `
        *,
        creator:profiles!group_events_creator_id_fkey (
          id,
          name,
          avatar_url
        ),
        group:groups!group_events_group_id_fkey (
          id,
          name,
          slug,
          avatar_url
        ),
        rsvps:group_event_rsvps (
          id,
          user_id,
          status,
          created_at,
          user:profiles!group_event_rsvps_user_id_fkey (
            id,
            name,
            avatar_url
          )
        )
      `
      )
      .eq('id', eventId)
      .eq('group_id', group.id)
      .single();

    if (eventError || !event) {
      return apiNotFound('Event not found');
    }

    // Check if user can view (public or member)
    if (!event.is_public) {
      const { data: membership } = await (supabase
        .from('group_members') as any)
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        return apiForbidden('This event is private');
      }
    }

    return apiSuccess({ event });
  } catch (error) {
    logger.error('Event GET error', { error }, 'Groups');
    return handleApiError(error);
  }
});

/**
 * PUT /api/groups/[slug]/events/[eventId]
 * Update event
 */
export const PUT = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ slug: string; eventId: string }> }
) => {
  try {
    const { slug, eventId } = await params;
    const { user } = req;
    const supabase = await createServerClient();

    // Get group by slug
    const { data: group2, error: groupError } = await (supabase
      .from('groups') as any)
      .select('id')
      .eq('slug', slug)
      .single();

    if (groupError || !group2) {
      return apiNotFound('Group not found');
    }

    // Get event
    const { data: event2, error: eventError } = await (supabase
      .from('group_events') as any)
      .select('id, group_id, creator_id')
      .eq('id', eventId)
      .eq('group_id', group2.id)
      .single();

    if (eventError || !event2) {
      return apiNotFound('Event not found');
    }

    // Check permissions (creator or admin)
    const isCreator = event2.creator_id === user.id;
    const { data: membership2 } = await (supabase
      .from('group_members') as any)
      .select('role')
      .eq('group_id', group2.id)
      .eq('user_id', user.id)
      .maybeSingle();

    const isAdmin = membership2 && ['founder', 'admin'].includes(membership2.role);

    if (!isCreator && !isAdmin) {
      return apiForbidden('Only event creator or group admins can update events');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = updateEventSchema.safeParse(body);

    if (!validation.success) {
      return apiValidationError('Invalid request data', {
        fields: validation.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // Update event
    const { data: updatedEvent, error: updateError } = await (supabase
      .from('group_events') as any)
      .update(validation.data)
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update event', { error: updateError, eventId }, 'Groups');
      return handleApiError(updateError);
    }

    return apiSuccess({ event: updatedEvent });
  } catch (error) {
    logger.error('Event PUT error', { error }, 'Groups');
    return handleApiError(error);
  }
});

/**
 * DELETE /api/groups/[slug]/events/[eventId]
 * Delete event
 */
export const DELETE = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ slug: string; eventId: string }> }
) => {
  try {
    const { slug, eventId } = await params;
    const { user } = req;
    const supabase = await createServerClient();

    // Get group by slug
    const { data: group3, error: groupError } = await (supabase
      .from('groups') as any)
      .select('id')
      .eq('slug', slug)
      .single();

    if (groupError || !group3) {
      return apiNotFound('Group not found');
    }

    // Get event
    const { data: event3, error: eventError } = await (supabase
      .from('group_events') as any)
      .select('id, group_id, creator_id, title')
      .eq('id', eventId)
      .eq('group_id', group3.id)
      .single();

    if (eventError || !event3) {
      return apiNotFound('Event not found');
    }

    // Check permissions (creator or admin)
    const isCreator3 = event3.creator_id === user.id;
    const { data: membership3 } = await (supabase
      .from('group_members') as any)
      .select('role')
      .eq('group_id', group3.id)
      .eq('user_id', user.id)
      .maybeSingle();

    const isAdmin3 = membership3 && ['founder', 'admin'].includes(membership3.role);

    if (!isCreator3 && !isAdmin3) {
      return apiForbidden('Only event creator or group admins can delete events');
    }

    // Delete event (RSVPs will be cascade deleted)
    const { error: deleteError } = await (supabase
      .from('group_events') as any)
      .delete()
      .eq('id', eventId);

    if (deleteError) {
      logger.error('Failed to delete event', { error: deleteError, eventId }, 'Groups');
      return handleApiError(deleteError);
    }

    return apiSuccess({ message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Event DELETE error', { error }, 'Groups');
    return handleApiError(error);
  }
});


