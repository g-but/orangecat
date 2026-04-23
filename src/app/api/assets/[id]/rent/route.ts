/**
 * Asset Rental API
 *
 * POST /api/assets/[id]/rent - Request a rental for an asset
 */

import { createBookingService } from '@/services/bookings';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { DATABASE_TABLES } from '@/config/database-tables';
import { STATUS } from '@/config/database-constants';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { apiCreated, apiBadRequest, apiNotFound, apiInternalError, apiRateLimited } from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { getUserActorId } from '@/domain/actors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const rentAssetSchema = z.object({
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

// Milliseconds per rental period type
const PERIOD_MS: Record<string, number> = {
  hourly: 3_600_000,
  daily: 86_400_000,
  weekly: 604_800_000,
  monthly: 2_592_000_000,
};

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id: assetId } = await context.params;
  const idValidation = getValidationError(validateUUID(assetId, 'asset ID'));
  if (idValidation) {return idValidation;}
  try {
    const { user, supabase } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many rent requests. Please slow down.', retryAfterSeconds(rl));}

    const body = await request.json();
    const result = rentAssetSchema.safeParse(body);
    if (!result.success) {return apiBadRequest('Validation failed', result.error.flatten());}

    const { starts_at, ends_at, notes } = result.data;
    const startsAt = new Date(starts_at);
    const endsAt = new Date(ends_at);

    const { data: asset, error: assetError } = await supabase
      .from(DATABASE_TABLES.USER_ASSETS)
      .select('id, title, actor_id, is_for_rent, rental_price_btc, rental_period_type, min_rental_period, max_rental_period, requires_deposit, deposit_amount_btc, currency')
      .eq('id', assetId).eq('status', STATUS.ASSETS.ACTIVE).eq('is_for_rent', true)
      .single();

    if (assetError || !asset) {return apiNotFound('Asset not found or not available for rent');}

    const customerActorId = await getUserActorId(supabase, user.id);
    if (!customerActorId) {return apiBadRequest('Customer profile not found');}

    const periodMs = PERIOD_MS[asset.rental_period_type] || PERIOD_MS.daily;
    const periods = Math.ceil((endsAt.getTime() - startsAt.getTime()) / periodMs);

    if (asset.min_rental_period && periods < asset.min_rental_period) {
      return apiBadRequest(`Minimum rental period is ${asset.min_rental_period} ${asset.rental_period_type} periods`);
    }
    if (asset.max_rental_period && periods > asset.max_rental_period) {
      return apiBadRequest(`Maximum rental period is ${asset.max_rental_period} ${asset.rental_period_type} periods`);
    }

    const priceBtc = (asset.rental_price_btc || 0) * periods;
    const depositBtc = asset.requires_deposit ? asset.deposit_amount_btc || 0 : 0;

    const bookingService = createBookingService(supabase);
    const bookingResult = await bookingService.createBooking({
      bookableType: 'asset',
      bookableId: assetId,
      providerActorId: asset.actor_id,
      customerActorId: customerActorId,
      customerUserId: user.id,
      startsAt,
      endsAt,
      priceBtc,
      depositBtc,
      customerNotes: notes,
      metadata: { asset_title: asset.title, rental_period_type: asset.rental_period_type, rental_periods: periods, currency: asset.currency },
    });

    if (!bookingResult.success) {return apiBadRequest(bookingResult.error);}
    return apiCreated(bookingResult.booking);
  } catch (error) {
    logger.error('Rent asset error', error, 'AssetRentAPI');
    return apiInternalError('Internal server error');
  }
});
