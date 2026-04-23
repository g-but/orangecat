/**
 * Service Availability API
 *
 * GET /api/services/[id]/availability - Get available time slots for a service
 */

import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/lib/api/withAuth';
import { createBookingService } from '@/services/bookings';
import { getTableName } from '@/config/entity-registry';
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
  const { id: serviceId } = await context.params;
  const idValidation = getValidationError(validateUUID(serviceId, 'service ID'));
  if (idValidation) {return idValidation;}
  try {
    const { supabase } = request;
    const url = new URL((request as NextRequest).url);
    const dateParam = url.searchParams.get('date');

    if (!dateParam) {
      return apiBadRequest('Date parameter required (format: YYYY-MM-DD)');
    }

    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      return apiBadRequest('Invalid date format');
    }

    // Verify service exists
    const { data: service, error: serviceError } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from(getTableName('service')) as any
    )
      .select('id, title, actor_id, hourly_rate, fixed_price, currency')
      .eq('id', serviceId)
      .eq('status', STATUS.SERVICES.ACTIVE)
      .single();

    if (serviceError || !service) {
      return apiNotFound('Service not found');
    }

    const bookingService = createBookingService(supabase);
    const slots = await bookingService.getServiceAvailability(serviceId, date);

    return apiSuccess({
      service: {
        id: service.id,
        title: service.title,
        hourly_rate: service.hourly_rate,
        fixed_price: service.fixed_price,
        currency: service.currency,
      },
      date: dateParam,
      slots: slots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        available: slot.available,
      })),
    });
  } catch (error) {
    logger.error('Get availability error', error, 'ServiceAvailabilityAPI');
    return apiInternalError('Internal server error');
  }
});
