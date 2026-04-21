/**
 * Bookings API - List user's bookings
 *
 * GET /api/bookings - List bookings for current user
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { createBookingService } from '@/services/bookings';
import { BookingStatus } from '@/services/bookings';
import { logger } from '@/utils/logger';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const url = new URL(request.url);
    const role = url.searchParams.get('role') as 'customer' | 'provider' | 'both' | null;
    const statusParam = url.searchParams.get('status');
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const status = statusParam ? (statusParam.split(',') as BookingStatus[]) : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingService = createBookingService(supabase as any);
    const bookings = await bookingService.getUserBookings(user.id, {
      role: role || 'both',
      status,
      limit,
      offset,
    });

    return apiSuccess(bookings);
  } catch (error) {
    logger.error('Fetch bookings error', error, 'BookingsAPI');
    return apiInternalError();
  }
});
