/**
 * Service Availability API
 *
 * GET /api/services/[id]/availability - Get available time slots for a service
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createBookingService } from '@/services/bookings';
import { getTableName } from '@/config/entity-registry';
import { logger } from '@/utils/logger';
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  apiInternalError,
} from '@/lib/api/standardResponse';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: serviceId } = await params;
    const supabase = await createServerClient();

    const url = new URL(request.url);
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
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(getTableName('service')) as any
    )
      .select('id, title, actor_id, hourly_rate, fixed_price, currency')
      .eq('id', serviceId)
      .eq('status', 'active')
      .single();

    if (serviceError || !service) {
      return apiNotFound('Service not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingService = createBookingService(supabase as any);
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
}
