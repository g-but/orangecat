/**
 * Event RSVP API
 *
 * Handles RSVP operations for events.
 *
 * POST /api/groups/[slug]/events/[eventId]/rsvp - RSVP to event
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
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { z } from 'zod';

// Validation schema for RSVP
const rsvpSchema = z.object({
  status: z.enum(['going', 'maybe', 'not_going']),
});

/**
 * POST /api/groups/[slug]/events/[eventId]/rsvp
 * RSVP to an event
 */
export const POST = withAuth(
  async (
    req: AuthenticatedRequest,
    { params }: { params: Promise<{ slug: string; eventId: string }> }
  ) => {
    try {
      const { slug, eventId } = await params;
      const { user } = req;
      const supabase = await createServerClient();

      // Get group by slug
      const { data: group, error: groupError } = await (
        supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(DATABASE_TABLES.GROUPS) as any
      )
        .select('id')
        .eq('slug', slug)
        .single();

      if (groupError || !group) {
        return apiNotFound('Group not found');
      }

      // Get event
      const { data: event, error: eventError } = await (
        supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(DATABASE_TABLES.GROUP_EVENTS) as any
      )
        .select('id, group_id, is_public, requires_rsvp')
        .eq('id', eventId)
        .eq('group_id', group.id)
        .single();

      if (eventError || !event) {
        return apiNotFound('Event not found');
      }

      // Check if user can access the event (public or member)
      if (!event.is_public) {
        const { data: membership } = await (
          supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from(DATABASE_TABLES.GROUP_MEMBERS) as any
        )
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!membership) {
          return apiForbidden('You do not have access to this event');
        }
      }

      // Parse and validate request body
      const body = await req.json();
      const validation = rsvpSchema.safeParse(body);

      if (!validation.success) {
        return apiValidationError('Invalid request data', {
          fields: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      // Upsert RSVP
      const { data: rsvp, error: rsvpError } = await (
        supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(DATABASE_TABLES.GROUP_EVENT_RSVPS) as any
      )
        .upsert(
          {
            event_id: eventId,
            user_id: user.id,
            status: validation.data.status,
          },
          {
            onConflict: 'event_id,user_id',
          }
        )
        .select(
          `
        *,
        user:profiles!group_event_rsvps_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `
        )
        .single();

      if (rsvpError) {
        logger.error('Failed to RSVP to event', { error: rsvpError, eventId }, 'Groups');
        return handleApiError(rsvpError);
      }

      return apiSuccess({
        rsvp,
        message: `RSVP updated to ${validation.data.status}`,
      });
    } catch (error) {
      logger.error('Event RSVP error', { error }, 'Groups');
      return handleApiError(error);
    }
  }
);
