/**
 * Asset Rental API
 *
 * POST /api/assets/[id]/rent - Request a rental for an asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createBookingService } from '@/services/bookings';
import { DATABASE_TABLES } from '@/config/database-tables';
import { z } from 'zod';
import { logger } from '@/utils/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const rentAssetSchema = z.object({
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assetId } = await params;
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = rentAssetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { starts_at, ends_at, notes } = result.data;
    const startsAt = new Date(starts_at);
    const endsAt = new Date(ends_at);

    // Verify asset exists and is for rent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: assetData, error: assetError } = await (
      supabase.from(DATABASE_TABLES.USER_ASSETS) as any
    )
      .select(
        'id, title, actor_id, is_for_rent, rental_price_sats, rental_period_type, min_rental_period, max_rental_period, requires_deposit, deposit_amount_sats, currency'
      )
      .eq('id', assetId)
      .eq('status', 'active')
      .eq('is_for_rent', true)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asset = assetData as any;

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'Asset not found or not available for rent' },
        { status: 404 }
      );
    }

    // Get customer's actor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: customerActorData } = await (supabase.from('actors') as any)
      .select('id')
      .eq('user_id', user.id)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerActor = customerActorData as any;

    if (!customerActor) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 400 });
    }

    // Calculate rental duration and price
    const durationMs = endsAt.getTime() - startsAt.getTime();
    let periods = 0;

    switch (asset.rental_period_type) {
      case 'hourly':
        periods = Math.ceil(durationMs / (1000 * 60 * 60));
        break;
      case 'daily':
        periods = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
        break;
      case 'weekly':
        periods = Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7));
        break;
      case 'monthly':
        periods = Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 30));
        break;
      default:
        periods = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    }

    // Check minimum rental period
    if (asset.min_rental_period && periods < asset.min_rental_period) {
      return NextResponse.json(
        {
          error: `Minimum rental period is ${asset.min_rental_period} ${asset.rental_period_type} periods`,
        },
        { status: 400 }
      );
    }

    // Check maximum rental period
    if (asset.max_rental_period && periods > asset.max_rental_period) {
      return NextResponse.json(
        {
          error: `Maximum rental period is ${asset.max_rental_period} ${asset.rental_period_type} periods`,
        },
        { status: 400 }
      );
    }

    const priceSats = (asset.rental_price_sats || 0) * periods;
    const depositSats = asset.requires_deposit ? asset.deposit_amount_sats || 0 : 0;

    // Create the booking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingService = createBookingService(supabase as any);
    const bookingResult = await bookingService.createBooking({
      bookableType: 'asset',
      bookableId: assetId,
      providerActorId: asset.actor_id,
      customerActorId: customerActor.id,
      customerUserId: user.id,
      startsAt,
      endsAt,
      priceSats,
      depositSats,
      customerNotes: notes,
      metadata: {
        asset_title: asset.title,
        rental_period_type: asset.rental_period_type,
        rental_periods: periods,
        currency: asset.currency,
      },
    });

    if (!bookingResult.success) {
      return NextResponse.json(
        {
          error: bookingResult.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: bookingResult.booking,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Rent asset error', error, 'AssetRentAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
