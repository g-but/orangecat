/**
 * Bookings API - List user's bookings
 *
 * GET /api/bookings - List bookings for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createBookingService } from '@/services/bookings';
import { BookingStatus } from '@/services/bookings';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const role = url.searchParams.get('role') as 'customer' | 'provider' | 'both' | null;
    const statusParam = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const status = statusParam ? (statusParam.split(',') as BookingStatus[]) : undefined;

    const bookingService = createBookingService(supabase);
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
    console.error('Fetch bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
