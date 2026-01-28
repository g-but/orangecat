/**
 * Asset Availability API
 *
 * GET /api/assets/[id]/availability - Get availability for an asset rental
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createBookingService } from '@/services/bookings';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assetId } = await params;
    const supabase = await createServerClient();

    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('start_date');
    const endDateParam = url.searchParams.get('end_date');

    if (!startDateParam) {
      return NextResponse.json(
        {
          error: 'start_date parameter required (format: YYYY-MM-DD)',
        },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Invalid start_date format',
        },
        { status: 400 }
      );
    }

    // Default end_date to 30 days from start if not provided
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Invalid end_date format',
        },
        { status: 400 }
      );
    }

    // Verify asset exists and is for rent
    const { data: asset, error: assetError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from(DATABASE_TABLES.USER_ASSETS) as any)
        .select(
          'id, title, actor_id, is_for_rent, rental_price_sats, rental_period_type, min_rental_period, max_rental_period, requires_deposit, deposit_amount_sats'
        )
        .eq('id', assetId)
        .eq('status', 'active')
        .eq('is_for_rent', true)
        .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'Asset not found or not available for rent' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingService = createBookingService(supabase as any);
    const availability = await bookingService.getAssetAvailability(assetId, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: {
        asset: {
          id: asset.id,
          title: asset.title,
          rental_price_sats: asset.rental_price_sats,
          rental_period_type: asset.rental_period_type,
          min_rental_period: asset.min_rental_period,
          max_rental_period: asset.max_rental_period,
          requires_deposit: asset.requires_deposit,
          deposit_amount_sats: asset.deposit_amount_sats,
        },
        start_date: startDateParam,
        end_date: endDate.toISOString().split('T')[0],
        availability: availability.map(day => ({
          date: day.date.toISOString().split('T')[0],
          available: day.available,
        })),
      },
    });
  } catch (error) {
    logger.error('Get asset availability error', error, 'AssetAvailabilityAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
