/**
 * Booking Service
 *
 * Handles booking operations for services and asset rentals.
 * Provides availability checking, booking creation, and status management.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Type alias for any SupabaseClient (accepts any database schema)
type AnySupabaseClient = SupabaseClient<any, any, any>;
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

// Types
export type BookableType = 'service' | 'asset';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'no_show';

export interface Booking {
  id: string;
  bookable_type: BookableType;
  bookable_id: string;
  provider_actor_id: string;
  customer_actor_id: string;
  customer_user_id: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  duration_minutes?: number;
  price_sats: number;
  currency: string;
  deposit_sats: number;
  deposit_paid: boolean;
  total_paid_sats: number;
  status: BookingStatus;
  customer_notes?: string;
  provider_notes?: string;
  cancellation_reason?: string;
  metadata?: Record<string, unknown>;
  confirmed_at?: string;
  cancelled_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: string;
  service_id: string;
  provider_actor_id: string;
  day_of_week?: number;
  specific_date?: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_bookings: number;
  current_bookings: number;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface CreateBookingParams {
  bookableType: BookableType;
  bookableId: string;
  providerActorId: string;
  customerActorId: string;
  customerUserId: string;
  startsAt: Date;
  endsAt: Date;
  priceSats: number;
  depositSats?: number;
  customerNotes?: string;
  metadata?: Record<string, unknown>;
}

export interface BookingResult {
  success: boolean;
  booking?: Booking;
  error?: string;
}

/**
 * Booking Service Class
 */
export class BookingService {
  constructor(private supabase: AnySupabaseClient) {}

  /**
   * Get available time slots for a service on a given date
   */
  async getServiceAvailability(serviceId: string, date: Date): Promise<TimeSlot[]> {
    const dayOfWeek = date.getDay();
    const dateString = date.toISOString().split('T')[0];

    // Get recurring slots for this day of week
    const { data: recurringSlots } = await this.supabase
      .from(DATABASE_TABLES.AVAILABILITY_SLOTS)
      .select('*')
      .eq('service_id', serviceId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true);

    // Get specific date slots
    const { data: specificSlots } = await this.supabase
      .from(DATABASE_TABLES.AVAILABILITY_SLOTS)
      .select('*')
      .eq('service_id', serviceId)
      .eq('specific_date', dateString)
      .eq('is_available', true);

    const allSlots = [...(recurringSlots || []), ...(specificSlots || [])];

    // Get existing bookings for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: existingBookings } = await this.supabase
      .from(DATABASE_TABLES.BOOKINGS)
      .select('starts_at, ends_at')
      .eq('bookable_type', 'service')
      .eq('bookable_id', serviceId)
      .in('status', ['confirmed', 'in_progress'])
      .gte('starts_at', startOfDay.toISOString())
      .lte('starts_at', endOfDay.toISOString());

    // Convert slots to TimeSlot format and check availability
    const timeSlots: TimeSlot[] = [];

    for (const slot of allSlots) {
      const [startHour, startMin] = slot.start_time.split(':').map(Number);
      const [endHour, endMin] = slot.end_time.split(':').map(Number);

      const slotStart = new Date(date);
      slotStart.setHours(startHour, startMin, 0, 0);

      const slotEnd = new Date(date);
      slotEnd.setHours(endHour, endMin, 0, 0);

      // Check if slot conflicts with existing bookings
      const isConflicted = existingBookings?.some(booking => {
        const bookingStart = new Date(booking.starts_at);
        const bookingEnd = new Date(booking.ends_at);
        return (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        );
      });

      timeSlots.push({
        start: slotStart,
        end: slotEnd,
        available: !isConflicted && slot.current_bookings < slot.max_bookings,
      });
    }

    return timeSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  /**
   * Get available dates for an asset rental
   */
  async getAssetAvailability(
    assetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: Date; available: boolean }[]> {
    // Get asset availability settings
    const { data: availability } = await this.supabase
      .from(DATABASE_TABLES.ASSET_AVAILABILITY)
      .select('*')
      .eq('asset_id', assetId)
      .eq('is_available', true)
      .single();

    if (!availability) {
      return [];
    }

    // Get existing bookings in the date range
    const { data: existingBookings } = await this.supabase
      .from(DATABASE_TABLES.BOOKINGS)
      .select('starts_at, ends_at')
      .eq('bookable_type', 'asset')
      .eq('bookable_id', assetId)
      .in('status', ['confirmed', 'in_progress'])
      .gte('starts_at', startDate.toISOString())
      .lte('ends_at', endDate.toISOString());

    const blockedDates = availability.blocked_dates || [];
    const results: { date: Date; available: boolean }[] = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];

      // Check if date is in blocked list
      const isBlocked = blockedDates.some(
        (blocked: { start: string; end: string }) =>
          dateStr >= blocked.start && dateStr <= blocked.end
      );

      // Check if date conflicts with existing booking
      const isBooked = existingBookings?.some(booking => {
        const bookingStart = new Date(booking.starts_at).toISOString().split('T')[0];
        const bookingEnd = new Date(booking.ends_at).toISOString().split('T')[0];
        return dateStr >= bookingStart && dateStr <= bookingEnd;
      });

      // Check if date is within availability range
      const inRange =
        dateStr >= availability.available_from &&
        (!availability.available_to || dateStr <= availability.available_to);

      results.push({
        date: new Date(current),
        available: !isBlocked && !isBooked && inRange,
      });

      current.setDate(current.getDate() + 1);
    }

    return results;
  }

  /**
   * Create a new booking
   */
  async createBooking(params: CreateBookingParams): Promise<BookingResult> {
    const {
      bookableType,
      bookableId,
      providerActorId,
      customerActorId,
      customerUserId,
      startsAt,
      endsAt,
      priceSats,
      depositSats = 0,
      customerNotes,
      metadata,
    } = params;

    // Check for conflicts using database function
    const { data: hasConflict } = await this.supabase.rpc('check_booking_conflict', {
      p_bookable_type: bookableType,
      p_bookable_id: bookableId,
      p_starts_at: startsAt.toISOString(),
      p_ends_at: endsAt.toISOString(),
    });

    if (hasConflict) {
      return {
        success: false,
        error: 'This time slot is no longer available',
      };
    }

    // Calculate duration
    const durationMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / (1000 * 60));

    // Create the booking
    const { data: booking, error } = await this.supabase
      .from(DATABASE_TABLES.BOOKINGS)
      .insert({
        bookable_type: bookableType,
        bookable_id: bookableId,
        provider_actor_id: providerActorId,
        customer_actor_id: customerActorId,
        customer_user_id: customerUserId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        duration_minutes: durationMinutes,
        price_sats: priceSats,
        deposit_sats: depositSats,
        customer_notes: customerNotes,
        metadata,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating booking', { error }, 'BookingService');
      return {
        success: false,
        error: 'Failed to create booking',
      };
    }

    return {
      success: true,
      booking,
    };
  }

  /**
   * Confirm a pending booking (provider action)
   */
  async confirmBooking(bookingId: string, providerActorId: string): Promise<BookingResult> {
    const { data: booking, error } = await this.supabase
      .from(DATABASE_TABLES.BOOKINGS)
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('provider_actor_id', providerActorId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !booking) {
      return {
        success: false,
        error: 'Failed to confirm booking',
      };
    }

    return {
      success: true,
      booking,
    };
  }

  /**
   * Reject a pending booking (provider action)
   */
  async rejectBooking(
    bookingId: string,
    providerActorId: string,
    reason?: string
  ): Promise<BookingResult> {
    const { data: booking, error } = await this.supabase
      .from(DATABASE_TABLES.BOOKINGS)
      .update({
        status: 'rejected',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('provider_actor_id', providerActorId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !booking) {
      return {
        success: false,
        error: 'Failed to reject booking',
      };
    }

    return {
      success: true,
      booking,
    };
  }

  /**
   * Cancel a booking (customer action)
   */
  async cancelBooking(
    bookingId: string,
    customerUserId: string,
    reason?: string
  ): Promise<BookingResult> {
    const { data: booking, error } = await this.supabase
      .from(DATABASE_TABLES.BOOKINGS)
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('customer_user_id', customerUserId)
      .in('status', ['pending', 'confirmed'])
      .select()
      .single();

    if (error || !booking) {
      return {
        success: false,
        error: 'Failed to cancel booking',
      };
    }

    return {
      success: true,
      booking,
    };
  }

  /**
   * Mark booking as completed (provider action)
   */
  async completeBooking(bookingId: string, providerActorId: string): Promise<BookingResult> {
    const { data: booking, error } = await this.supabase
      .from(DATABASE_TABLES.BOOKINGS)
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('provider_actor_id', providerActorId)
      .in('status', ['confirmed', 'in_progress'])
      .select()
      .single();

    if (error || !booking) {
      return {
        success: false,
        error: 'Failed to complete booking',
      };
    }

    return {
      success: true,
      booking,
    };
  }

  /**
   * Get bookings for a user (as customer or provider)
   */
  async getUserBookings(
    userId: string,
    options: {
      role?: 'customer' | 'provider' | 'both';
      status?: BookingStatus[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<
    (Booking & {
      customer?: { id: string; username: string; display_name?: string; avatar_url?: string };
    })[]
  > {
    const { role = 'both', status, limit = 20, offset = 0 } = options;

    // Get user's actor IDs
    const { data: actors } = await this.supabase.from('actors').select('id').eq('user_id', userId);

    const actorIds = actors?.map(a => a.id) || [];

    let query = this.supabase
      .from(DATABASE_TABLES.BOOKINGS)
      .select(
        `
        *,
        customer:customer_actor_id(
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .order('starts_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (role === 'customer') {
      query = query.eq('customer_user_id', userId);
    } else if (role === 'provider') {
      query = query.in('provider_actor_id', actorIds);
    } else {
      query = query.or(
        `customer_user_id.eq.${userId},provider_actor_id.in.(${actorIds.join(',')})`
      );
    }

    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching bookings', { error }, 'BookingService');
      return [];
    }

    return data || [];
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<Booking | null> {
    const { data, error } = await this.supabase
      .from(DATABASE_TABLES.BOOKINGS)
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }
}

/**
 * Create booking service instance
 */
export function createBookingService(supabase: AnySupabaseClient): BookingService {
  return new BookingService(supabase);
}
