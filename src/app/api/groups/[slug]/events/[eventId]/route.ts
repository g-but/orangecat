/**
 * Individual Event API
 *
 * GET    /api/groups/[slug]/events/[eventId] - Get event details
 * PUT    /api/groups/[slug]/events/[eventId] - Update event (creator/admin)
 * DELETE /api/groups/[slug]/events/[eventId] - Delete event (creator/admin)
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiForbidden, apiNotFound, apiValidationError, apiRateLimited, handleApiError } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { z } from 'zod';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { resolveGroupBySlug, canEditEvent, checkGroupMember } from '@/domain/groups/helpers.server';

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

export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ slug: string; eventId: string }> }) => {
    const { slug, eventId } = await params;
    const idValidation = getValidationError(validateUUID(eventId, 'event ID'));
    if (idValidation) {return idValidation;}
    try {
      const { user, supabase } = req;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const group = await resolveGroupBySlug(supabase, slug);
      if (!group) {return apiNotFound('Group not found');}

      const { data: event, error: eventError } = await db
        .from(DATABASE_TABLES.GROUP_EVENTS)
        .select(`*, creator:profiles!group_events_creator_id_fkey (id, name, avatar_url),
          group:groups!group_events_group_id_fkey (id, name, slug, avatar_url),
          rsvps:group_event_rsvps (id, user_id, status, created_at, user:profiles!group_event_rsvps_user_id_fkey (id, name, avatar_url))`)
        .eq('id', eventId).eq('group_id', group.id).single();

      if (eventError || !event) {return apiNotFound('Event not found');}
      if (!event.is_public && !await checkGroupMember(supabase, group.id, user.id)) {return apiForbidden('This event is private');}

      return apiSuccess({ event });
    } catch (error) {
      logger.error('Event GET error', { error }, 'Groups');
      return handleApiError(error);
    }
  }
);

export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ slug: string; eventId: string }> }) => {
    const { slug, eventId } = await params;
    const idValidation = getValidationError(validateUUID(eventId, 'event ID'));
    if (idValidation) {return idValidation;}
    try {
      const { user, supabase } = req;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));}

      const group = await resolveGroupBySlug(supabase, slug);
      if (!group) {return apiNotFound('Group not found');}

      const { data: event, error: eventError } = await db
        .from(DATABASE_TABLES.GROUP_EVENTS).select('id, group_id, creator_id').eq('id', eventId).eq('group_id', group.id).single();
      if (eventError || !event) {return apiNotFound('Event not found');}
      if (!await canEditEvent(supabase, group.id, user.id, event.creator_id)) {return apiForbidden('Only event creator or group admins can update events');}

      const body = await req.json();
      const validation = updateEventSchema.safeParse(body);
      if (!validation.success) {return apiValidationError('Invalid request data', validation.error.flatten());}

      const { data: updatedEvent, error: updateError } = await db
        .from(DATABASE_TABLES.GROUP_EVENTS).update(validation.data).eq('id', eventId).select().single();
      if (updateError) { logger.error('Failed to update event', { error: updateError, eventId }, 'Groups'); return handleApiError(updateError); }

      return apiSuccess({ event: updatedEvent });
    } catch (error) {
      logger.error('Event PUT error', { error }, 'Groups');
      return handleApiError(error);
    }
  }
);

export const DELETE = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ slug: string; eventId: string }> }) => {
    const { slug, eventId } = await params;
    const idValidation = getValidationError(validateUUID(eventId, 'event ID'));
    if (idValidation) {return idValidation;}
    try {
      const { user, supabase } = req;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));}

      const group = await resolveGroupBySlug(supabase, slug);
      if (!group) {return apiNotFound('Group not found');}

      const { data: event, error: eventError } = await db
        .from(DATABASE_TABLES.GROUP_EVENTS).select('id, group_id, creator_id').eq('id', eventId).eq('group_id', group.id).single();
      if (eventError || !event) {return apiNotFound('Event not found');}
      if (!await canEditEvent(supabase, group.id, user.id, event.creator_id)) {return apiForbidden('Only event creator or group admins can delete events');}

      const { error: deleteError } = await db.from(DATABASE_TABLES.GROUP_EVENTS).delete().eq('id', eventId);
      if (deleteError) { logger.error('Failed to delete event', { error: deleteError, eventId }, 'Groups'); return handleApiError(deleteError); }

      return apiSuccess({ message: 'Event deleted successfully' });
    } catch (error) {
      logger.error('Event DELETE error', { error }, 'Groups');
      return handleApiError(error);
    }
  }
);
