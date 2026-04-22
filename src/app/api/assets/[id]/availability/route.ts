/**
 * Asset Availability API
 *
 * GET /api/assets/[id]/availability - Get availability for an asset rental
 */

import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/lib/api/withAuth';
import { createBookingService } from '@/services/bookings';
import { DATABASE_TABLES } from '@/config/database-tables';
import { STATUS } from '@/config/database-constants';
import { logger } from '@/utils/logger';
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  apiInternalError,
} from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withOptionalAuth(async (request, context: RouteContext) => {
  const { id: assetId } = await context.params;
  const idValidation = getValidationError(validateUUID(assetId, 'asset ID'));
  if (idValidation) {return idValidation;}
  try {
    const { supabase } = request;
    const url = new URL((request as NextRequest).url);
    const startDateParam = url.searchParams.get('start_date');
    const endDateParam = url.searchParams.get('end_date');

    if (!startDateParam) {
      return apiBadRequest('start_date parameter required (format: YYYY-MM-DD)');
    }

    const startDate = new Date(startDateParam);
    if (isNaN(startDate.getTime())) {
      return apiBadRequest('Invalid start_date format');
    }

    // Default end_date to 30 days from start if not provided
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (isNaN(endDate.getTime())) {
      return apiBadRequest('Invalid end_date format');
    }

    // Verify asset exists and is for rent
    const { data: asset, error: assetError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from(DATABASE_TABLES.USER_ASSETS) as any)
        .select(
          'id, title, actor_id, is_for_rent, rental_price_btc, rental_period_type, min_rental_period, max_rental_period, requires_deposit, deposit_amount_btc'
        )
        .eq('id', assetId)
        .eq('status', STATUS.ASSETS.ACTIVE)
        .eq('is_for_rent', true)
        .single();

    if (assetError || !asset) {
      return apiNotFound('Asset not found or not available for rent');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingService = createBookingService(supabase as any);
    const availability = await bookingService.getAssetAvailability(assetId, startDate, endDate);

    return apiSuccess({
      asset: {
        id: asset.id,
        title: asset.title,
        rental_price_btc: asset.rental_price_btc,
        rental_period_type: asset.rental_period_type,
        min_rental_period: asset.min_rental_period,
        max_rental_period: asset.max_rental_period,
        requires_deposit: asset.requires_deposit,
        deposit_amount_btc: asset.deposit_amount_btc,
      },
      start_date: startDateParam,
      end_date: endDate.toISOString().split('T')[0],
      availability: availability.map(day => ({
        date: day.date.toISOString().split('T')[0],
        available: day.available,
      })),
    });
  } catch (error) {
    logger.error('Get asset availability error', error, 'AssetAvailabilityAPI');
    return apiInternalError('Internal server error');
  }
});
