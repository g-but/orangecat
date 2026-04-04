/**
 * Asset Rental API
 *
 * POST /api/assets/[id]/rent - Request a rental for an asset
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { createBookingService } from '@/services/bookings';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { DATABASE_TABLES } from '@/config/database-tables';
import { STATUS } from '@/config/database-constants';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import {
  apiCreated,
  apiBadRequest,
  apiNotFound,
  apiInternalError,
} from '@/lib/api/standardResponse';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const rentAssetSchema = z.object({
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: assetId } = await context.params;
    const { user, supabase } = request;

    const body = await request.json();
    const result = rentAssetSchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest('Validation failed', result.error.flatten());
    }

    const { starts_at, ends_at, notes } = result.data;
    const startsAt = new Date(starts_at);
    const endsAt = new Date(ends_at);

    // Verify asset exists and is for rent
    const { data: assetData, error: assetError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from(DATABASE_TABLES.USER_ASSETS) as any)
        .select(
          'id, title, actor_id, is_for_rent, rental_price_btc, rental_period_type, min_rental_period, max_rental_period, requires_deposit, deposit_amount_btc, currency'
        )
        .eq('id', assetId)
        .eq('status', STATUS.ASSETS.ACTIVE)
        .eq('is_for_rent', true)
        .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asset = assetData as any;

    if (assetError || !asset) {
      return apiNotFound('Asset not found or not available for rent');
    }

    // Get customer's actor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: customerActorData } = await (supabase.from(DATABASE_TABLES.ACTORS) as any)
      .select('id')
      .eq('user_id', user.id)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerActor = customerActorData as any;

    if (!customerActor) {
      return apiBadRequest('Customer profile not found');
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
      return apiBadRequest(
        `Minimum rental period is ${asset.min_rental_period} ${asset.rental_period_type} periods`
      );
    }

    // Check maximum rental period
    if (asset.max_rental_period && periods > asset.max_rental_period) {
      return apiBadRequest(
        `Maximum rental period is ${asset.max_rental_period} ${asset.rental_period_type} periods`
      );
    }

    const priceBtc = (asset.rental_price_btc || 0) * periods;
    const depositBtc = asset.requires_deposit ? asset.deposit_amount_btc || 0 : 0;

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
      priceBtc,
      depositBtc,
      customerNotes: notes,
      metadata: {
        asset_title: asset.title,
        rental_period_type: asset.rental_period_type,
        rental_periods: periods,
        currency: asset.currency,
      },
    });

    if (!bookingResult.success) {
      return apiBadRequest(bookingResult.error);
    }

    return apiCreated(bookingResult.booking);
  } catch (error) {
    logger.error('Rent asset error', error, 'AssetRentAPI');
    return apiInternalError('Internal server error');
  }
});
