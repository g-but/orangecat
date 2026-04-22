/**
 * Event RSVP API
 *
 * POST /api/groups/[slug]/events/[eventId]/rsvp - RSVP to event
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiForbidden, apiNotFound, apiValidationError, apiRateLimited, handleApiError } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { z } from 'zod';

const rsvpSchema = z.object({
  status: z.enum(['going', 'maybe', 'not_going']),
});

export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ slug: string; eventId: string }> }) => {
    try {
      const { slug, eventId } = await params;
      const { user } = req;

      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {return apiRateLimited('Too many RSVP requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));}

      const supabase = await createServerClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const { data: group, error: groupError } = await db.from(DATABASE_TABLES.GROUPS).select('id').eq('slug', slug).single();
      if (groupError || !group) {return apiNotFound('Group not found');}

      const { data: event, error: eventError } = await db
        .from(DATABASE_TABLES.GROUP_EVENTS)
        .select('id, group_id, is_public, requires_rsvp')
        .eq('id', eventId).eq('group_id', group.id)
        .single();
      if (eventError || !event) {return apiNotFound('Event not found');}

      if (!event.is_public) {
        const { data: membership } = await db
          .from(DATABASE_TABLES.GROUP_MEMBERS).select('id').eq('group_id', group.id).eq('user_id', user.id).maybeSingle();
        if (!membership) {return apiForbidden('You do not have access to this event');}
      }

      const body = await req.json();
      const validation = rsvpSchema.safeParse(body);
      if (!validation.success) {
        return apiValidationError('Invalid request data', { fields: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) });
      }

      const { data: rsvp, error: rsvpError } = await db
        .from(DATABASE_TABLES.GROUP_EVENT_RSVPS)
        .upsert({ event_id: eventId, user_id: user.id, status: validation.data.status }, { onConflict: 'event_id,user_id' })
        .select('*, user:profiles!group_event_rsvps_user_id_fkey (id, name, avatar_url)')
        .single();

      if (rsvpError) {
        logger.error('Failed to RSVP to event', { error: rsvpError, eventId }, 'Groups');
        return handleApiError(rsvpError);
      }

      return apiSuccess({ rsvp, message: `RSVP updated to ${validation.data.status}` });
    } catch (error) {
      logger.error('Event RSVP error', { error }, 'Groups');
      return handleApiError(error);
    }
  }
);
