/**
 * Single Booking API
 *
 * GET    /api/bookings/[id] - Get booking details
 * PUT    /api/bookings/[id] - Update booking status
 * DELETE /api/bookings/[id] - Cancel booking
 */

import { createBookingService } from '@/services/bookings';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { DATABASE_TABLES } from '@/config/database-tables';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { apiSuccess, apiNotFound, apiForbidden, apiBadRequest, apiInternalError, apiRateLimited } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';

interface RouteContext { params: Promise<{ id: string }> }

const updateBookingSchema = z.object({
  action: z.enum(['confirm', 'reject', 'complete', 'cancel']),
  reason: z.string().max(500).optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getActorIds(supabase: any, userId: string): Promise<string[]> {
  const { data: actors } = await (supabase.from(DATABASE_TABLES.ACTORS) as any).select('id').eq('user_id', userId);
  return actors?.map((a: { id: string }) => a.id) || [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tryProviderAction(actorIds: string[], fn: (id: string) => Promise<any>): Promise<any> {
  for (const actorId of actorIds) {
    const result = await fn(actorId);
    if (result.success) return result;
  }
  return undefined;
}

export const GET = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const { user, supabase } = request;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const booking = await createBookingService(supabase as any).getBooking(id);
    if (!booking) return apiNotFound('Booking not found');

    const actorIds = await getActorIds(supabase, user.id);
    const isCustomer = booking.customer_user_id === user.id;
    const isProvider = actorIds.includes(booking.provider_actor_id);
    if (!isCustomer && !isProvider) return apiForbidden('Access denied');

    return apiSuccess({ ...booking, role: isProvider ? 'provider' : 'customer' });
  } catch (error) {
    logger.error('Get booking error', error, 'BookingsAPI');
    return apiInternalError();
  }
});

export const PUT = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const { user, supabase } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));

    const body = await request.json();
    const result = updateBookingSchema.safeParse(body);
    if (!result.success) return apiBadRequest('Validation failed', result.error.flatten());

    const { action, reason } = result.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = createBookingService(supabase as any);
    const actorIds = await getActorIds(supabase, user.id);

    let bookingResult;
    if (action === 'cancel') {
      bookingResult = await svc.cancelBooking(id, user.id, reason);
    } else {
      const actionMap = {
        confirm: (aid: string) => svc.confirmBooking(id, aid),
        reject: (aid: string) => svc.rejectBooking(id, aid, reason),
        complete: (aid: string) => svc.completeBooking(id, aid),
      };
      bookingResult = await tryProviderAction(actorIds, actionMap[action]);
    }

    if (!bookingResult?.success) return apiBadRequest(bookingResult?.error || 'Action failed');
    return apiSuccess(bookingResult.booking);
  } catch (error) {
    logger.error('Update booking error', error, 'BookingsAPI');
    return apiInternalError();
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const { user, supabase } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await createBookingService(supabase as any).cancelBooking(id, user.id, new URL(request.url).searchParams.get('reason') || undefined);
    if (!result.success) return apiBadRequest(result.error || 'Cancel failed');
    return apiSuccess({ success: true });
  } catch (error) {
    logger.error('Cancel booking error', error, 'BookingsAPI');
    return apiInternalError();
  }
});
