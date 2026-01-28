/**
 * Bookings API - List user's bookings
 *
 * GET /api/bookings - List bookings for current user
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { NextResponse } from 'next/server';
import { createBookingService } from '@/services/bookings';
import { BookingStatus } from '@/services/bookings';
import { logger } from '@/utils/logger';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const url = new URL(request.url);
    const role = url.searchParams.get('role') as 'customer' | 'provider' | 'both' | null;
    const statusParam = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const status = statusParam ? (statusParam.split(',') as BookingStatus[]) : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingService = createBookingService(supabase as any);
    const bookings = await bookingService.getUserBookings(user.id, {
      role: role || 'both',
      status,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    logger.error('Fetch bookings error', error, 'BookingsAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
