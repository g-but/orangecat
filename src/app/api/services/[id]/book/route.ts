/**
 * Service Booking API
 *
 * POST /api/services/[id]/book - Request a booking for a service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createBookingService } from '@/services/bookings';
import { getTableName } from '@/config/entity-registry';
import { z } from 'zod';
import { logger } from '@/utils/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const bookServiceSchema = z.object({
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: serviceId } = await params;
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = bookServiceSchema.safeParse(body);

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

    // Verify service exists and is active
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
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get customer's actor
    const { data: customerActor } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('actors') as any
    )
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!customerActor) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 400 });
    }

    // Calculate price based on duration
    const durationHours = (endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60);
    let priceSats = 0;

    if (service.fixed_price) {
      priceSats = service.fixed_price;
    } else if (service.hourly_rate) {
      priceSats = Math.ceil(service.hourly_rate * durationHours);
    }

    // Create the booking
    const bookingService = createBookingService(supabase);
    const bookingResult = await bookingService.createBooking({
      bookableType: 'service',
      bookableId: serviceId,
      providerActorId: service.actor_id,
      customerActorId: customerActor.id,
      customerUserId: user.id,
      startsAt,
      endsAt,
      priceSats,
      customerNotes: notes,
      metadata: {
        service_title: service.title,
        currency: service.currency,
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
    logger.error('Book service error', error, 'ServiceBookAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
