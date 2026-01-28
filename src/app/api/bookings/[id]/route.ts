/**
 * Single Booking API
 *
 * GET    /api/bookings/[id] - Get booking details
 * PUT    /api/bookings/[id] - Update booking status
 * DELETE /api/bookings/[id] - Cancel booking
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { NextResponse } from 'next/server';
import { createBookingService } from '@/services/bookings';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { z } from 'zod';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateBookingSchema = z.object({
  action: z.enum(['confirm', 'reject', 'complete', 'cancel']),
  reason: z.string().max(500).optional(),
});

export const GET = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const { user, supabase } = request;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingService = createBookingService(supabase as any);
    const booking = await bookingService.getBooking(id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user has access (is customer or provider)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: actors } = await (supabase.from('actors') as any)
      .select('id')
      .eq('user_id', user.id);

    const actorIds = actors?.map((a: { id: string }) => a.id) || [];
    const isCustomer = booking.customer_user_id === user.id;
    const isProvider = actorIds.includes(booking.provider_actor_id);

    if (!isCustomer && !isProvider) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: booking,
      role: isProvider ? 'provider' : 'customer',
    });
  } catch (error) {
    logger.error('Get booking error', error, 'BookingsAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PUT = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const { user, supabase } = request;

    const body = await request.json();
    const result = updateBookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { action, reason } = result.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingService = createBookingService(supabase as any);

    // Get user's actor IDs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: actors } = await (supabase.from('actors') as any)
      .select('id')
      .eq('user_id', user.id);

    const actorIds = actors?.map((a: { id: string }) => a.id) || [];

    let bookingResult;

    switch (action) {
      case 'confirm':
        // Provider action
        for (const actorId of actorIds) {
          bookingResult = await bookingService.confirmBooking(id, actorId);
          if (bookingResult.success) {
            break;
          }
        }
        break;

      case 'reject':
        // Provider action
        for (const actorId of actorIds) {
          bookingResult = await bookingService.rejectBooking(id, actorId, reason);
          if (bookingResult.success) {
            break;
          }
        }
        break;

      case 'complete':
        // Provider action
        for (const actorId of actorIds) {
          bookingResult = await bookingService.completeBooking(id, actorId);
          if (bookingResult.success) {
            break;
          }
        }
        break;

      case 'cancel':
        // Customer action
        bookingResult = await bookingService.cancelBooking(id, user.id, reason);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!bookingResult?.success) {
      return NextResponse.json(
        {
          error: bookingResult?.error || 'Action failed',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bookingResult.booking,
    });
  } catch (error) {
    logger.error('Update booking error', error, 'BookingsAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const { user, supabase } = request;

    const url = new URL(request.url);
    const reason = url.searchParams.get('reason') || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingService = createBookingService(supabase as any);
    const result = await bookingService.cancelBooking(id, user.id, reason);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Cancel booking error', error, 'BookingsAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
