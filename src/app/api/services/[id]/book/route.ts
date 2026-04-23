/**
 * Service Booking API
 *
 * POST /api/services/[id]/book - Request a booking for a service
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { createBookingService } from '@/services/bookings';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { getTableName } from '@/config/entity-registry';
import { STATUS } from '@/config/database-constants';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import {
  apiBadRequest,
  apiNotFound,
  apiCreated,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { getUserActorId } from '@/domain/actors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const bookServiceSchema = z.object({
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id: serviceId } = await context.params;
  const idValidation = getValidationError(validateUUID(serviceId, 'service ID'));
  if (idValidation) {return idValidation;}
  try {
    const { user, supabase } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = retryAfterSeconds(rl);
      return apiRateLimited('Too many booking requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const result = bookServiceSchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest('Validation failed', result.error.flatten());
    }

    const { starts_at, ends_at, notes } = result.data;
    const startsAt = new Date(starts_at);
    const endsAt = new Date(ends_at);

    // Verify service exists and is active
    const { data: service, error: serviceError } = await supabase
        .from(getTableName('service'))
      .select('id, title, actor_id, hourly_rate, fixed_price, currency')
      .eq('id', serviceId)
      .eq('status', STATUS.SERVICES.ACTIVE)
      .single();

    if (serviceError || !service) {
      return apiNotFound('Service not found');
    }

    // Get customer's actor
    const customerActorId = await getUserActorId(supabase, user.id);
    if (!customerActorId) {
      return apiBadRequest('Customer profile not found');
    }

    // Calculate price based on duration
    const durationHours = (endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60);
    let priceBtc = 0;

    if (service.fixed_price) {
      priceBtc = service.fixed_price;
    } else if (service.hourly_rate) {
      priceBtc = Math.ceil(service.hourly_rate * durationHours);
    }

    // Create the booking
    const bookingService = createBookingService(supabase);
    const bookingResult = await bookingService.createBooking({
      bookableType: 'service',
      bookableId: serviceId,
      providerActorId: service.actor_id,
      customerActorId: customerActorId,
      customerUserId: user.id,
      startsAt,
      endsAt,
      priceBtc,
      customerNotes: notes,
      metadata: {
        service_title: service.title,
        currency: service.currency,
      },
    });

    if (!bookingResult.success) {
      return apiBadRequest(bookingResult.error);
    }

    return apiCreated(bookingResult.booking);
  } catch (error) {
    logger.error('Book service error', error, 'ServiceBookAPI');
    return apiInternalError('Internal server error');
  }
});
