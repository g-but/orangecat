/**
 * Demand-side + social action handlers — Cat participating in the economy,
 * not just supplying it: follow, react, comment, manage bookings, and
 * inbox hygiene. Every handler goes through the user-scoped client (RLS),
 * resolves people by @username (what the model sees in context/search),
 * and reports exactly what happened.
 */

import { DATABASE_TABLES } from '@/config/database-tables';
import { NotificationService } from '@/lib/services/notifications';
import { logger } from '@/utils/logger';
import type { AnySupabaseClient } from '@/lib/supabase/types';
import type { ActionHandler } from './types';

/** Resolve "@alice" / "alice" to a profile id + display bits. */
async function resolveProfileByUsername(
  supabase: AnySupabaseClient,
  raw: string
): Promise<{ id: string; username: string; name: string | null } | null> {
  const username = raw.trim().replace(/^@/, '');
  if (!username) {
    return null;
  }
  const { data } = await supabase
    .from(DATABASE_TABLES.PROFILES)
    .select('id, username, name')
    .eq('username', username)
    .maybeSingle();
  return (data as { id: string; username: string; name: string | null } | null) ?? null;
}

export const socialHandlers: Record<string, ActionHandler> = {
  follow_user: async (supabase, userId, _actorId, params) => {
    const target = await resolveProfileByUsername(supabase, String(params.username ?? ''));
    if (!target) {
      return {
        success: false,
        error: `No user found with username "${String(params.username ?? '')}".`,
      };
    }
    if (target.id === userId) {
      return { success: false, error: 'Cannot follow yourself.' };
    }
    const { data: existing } = await supabase
      .from(DATABASE_TABLES.FOLLOWS)
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', target.id)
      .maybeSingle();
    if (existing) {
      return { success: false, error: `Already following @${target.username}.` };
    }
    const { error } = await supabase
      .from(DATABASE_TABLES.FOLLOWS)
      .insert({ follower_id: userId, following_id: target.id });
    if (error) {
      return { success: false, error: error.message };
    }
    // Same courtesy notification the follow API sends (non-fatal).
    try {
      const { data: me } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('name, username')
        .eq('id', userId)
        .maybeSingle();
      const followerName = me?.name || me?.username || 'Someone';
      // Lazy import: the dispatcher pulls the email stack (resend/postal-mime),
      // which must stay out of this module graph (jest + bundle weight).
      const { NotificationDispatcher } = await import('@/services/notifications/dispatcher');
      await NotificationDispatcher.dispatch({
        userId: target.id,
        type: 'follow',
        title: `${followerName} followed you`,
        message: `${followerName} started following you on OrangeCat.`,
        sourceEntityType: 'profile',
        sourceEntityId: userId,
        actionUrl: me?.username ? `/profiles/${me.username}` : undefined,
      });
    } catch (err) {
      logger.warn('follow notification failed', { err }, 'CatSocial');
    }
    return {
      success: true,
      data: { displayMessage: `➕ Now following @${target.username}` },
    };
  },

  unfollow_user: async (supabase, userId, _actorId, params) => {
    const target = await resolveProfileByUsername(supabase, String(params.username ?? ''));
    if (!target) {
      return {
        success: false,
        error: `No user found with username "${String(params.username ?? '')}".`,
      };
    }
    const { data: existing } = await supabase
      .from(DATABASE_TABLES.FOLLOWS)
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', target.id)
      .maybeSingle();
    if (!existing) {
      return { success: false, error: `Not following @${target.username} — nothing to change.` };
    }
    const { error } = await supabase
      .from(DATABASE_TABLES.FOLLOWS)
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', target.id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: { displayMessage: `➖ Unfollowed @${target.username}` } };
  },

  like_post: async (supabase, userId, _actorId, params) => {
    const eventId = typeof params.post_id === 'string' ? params.post_id : '';
    if (!eventId) {
      return { success: false, error: 'Pass post_id (the timeline post to like).' };
    }
    const { data: existing } = await supabase
      .from(DATABASE_TABLES.TIMELINE_LIKES)
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) {
      return { success: false, error: 'Already liked that post.' };
    }
    const { error } = await supabase
      .from(DATABASE_TABLES.TIMELINE_LIKES)
      .insert({ event_id: eventId, user_id: userId });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: { displayMessage: '👍 Liked the post' } };
  },

  comment_on_post: async (supabase, userId, _actorId, params) => {
    const eventId = typeof params.post_id === 'string' ? params.post_id : '';
    const content = typeof params.content === 'string' ? params.content.trim() : '';
    if (!eventId || !content) {
      return { success: false, error: 'Pass post_id and content (the comment text).' };
    }
    const { error } = await supabase
      .from(DATABASE_TABLES.TIMELINE_COMMENTS)
      .insert({ event_id: eventId, user_id: userId, content: content.slice(0, 5000) });
    if (error) {
      return { success: false, error: error.message };
    }
    return {
      success: true,
      data: { displayMessage: `💬 Comment posted: "${content.slice(0, 60)}"` },
    };
  },

  mark_notifications_read: async (supabase, userId) => {
    const service = new NotificationService(supabase as never);
    const before = await service.getUnreadCount(userId);
    if (before === 0) {
      return { success: true, data: { displayMessage: 'Inbox already clear — nothing unread.' } };
    }
    const ok = await service.markAllAsRead(userId);
    if (!ok) {
      return { success: false, error: 'Could not mark notifications read.' };
    }
    return {
      success: true,
      data: { displayMessage: `📭 Marked ${before} notification${before === 1 ? '' : 's'} read` },
    };
  },

  book_service: async (supabase, userId, _actorId, params) => {
    const bookableId = typeof params.service_id === 'string' ? params.service_id : '';
    const startsAt = typeof params.starts_at === 'string' ? params.starts_at : '';
    if (!bookableId || !startsAt) {
      return {
        success: false,
        error: 'Pass service_id (from context or search) and starts_at (ISO date-time).',
      };
    }
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) {
      return { success: false, error: `Invalid starts_at "${startsAt}" — use ISO date-time.` };
    }
    const endsAt =
      typeof params.ends_at === 'string' && !Number.isNaN(new Date(params.ends_at).getTime())
        ? params.ends_at
        : new Date(start.getTime() + 60 * 60 * 1000).toISOString();

    // Lazy: the booking service transitively imports the email stack.
    const { createBookingService } = await import('@/services/bookings');
    const bookings = createBookingService(supabase);
    const result = await bookings.createBooking(
      {
        bookable_type: 'service',
        bookable_id: bookableId,
        starts_at: start.toISOString(),
        ends_at: endsAt,
        customer_notes: typeof params.notes === 'string' ? params.notes : undefined,
      },
      userId
    );
    if (!result.success) {
      return { success: false, error: result.error ?? 'Booking failed.' };
    }
    return {
      success: true,
      data: {
        ...(result.booking ?? {}),
        displayMessage: `📅 Booking requested for ${start.toISOString()} — the provider must confirm it.`,
      },
    };
  },

  accept_booking: async (supabase, _userId, actorId, params) => {
    const bookingId = typeof params.booking_id === 'string' ? params.booking_id : '';
    if (!bookingId) {
      return { success: false, error: 'Pass booking_id (shown in your bookings context).' };
    }
    const { createBookingService } = await import('@/services/bookings');
    const bookings = createBookingService(supabase);
    const result = await bookings.confirmBooking(bookingId, actorId);
    if (!result.success) {
      return { success: false, error: result.error ?? 'Could not confirm the booking.' };
    }
    return { success: true, data: { displayMessage: '✅ Booking confirmed' } };
  },

  decline_booking: async (supabase, _userId, actorId, params) => {
    const bookingId = typeof params.booking_id === 'string' ? params.booking_id : '';
    if (!bookingId) {
      return { success: false, error: 'Pass booking_id (shown in your bookings context).' };
    }
    const { createBookingService } = await import('@/services/bookings');
    const bookings = createBookingService(supabase);
    const result = await bookings.rejectBooking(
      bookingId,
      actorId,
      typeof params.reason === 'string' ? params.reason : undefined
    );
    if (!result.success) {
      return { success: false, error: result.error ?? 'Could not decline the booking.' };
    }
    return { success: true, data: { displayMessage: '🚫 Booking declined' } };
  },
};
