'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, CreditCard, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface BookingFormProps {
  serviceId: string;
  serviceName: string;
  priceSats: number;
  currency?: string;
  selectedSlot: { start: Date; end: Date } | null;
  onBack?: () => void;
}

export function BookingForm({
  serviceId,
  serviceName,
  priceSats,
  currency = 'SATS',
  selectedSlot,
  onBack,
}: BookingFormProps) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  if (!selectedSlot) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Please select a time slot first</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/services/${serviceId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starts_at: selectedSlot.start.toISOString(),
          ends_at: selectedSlot.end.toISOString(),
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setBookingId(data.data.id);
        toast.success('Booking request sent!');
      } else {
        toast.error(data.error || 'Failed to create booking');
      }
    } catch (error) {
      logger.error(
        'Booking error',
        { error: error instanceof Error ? error.message : error },
        'BookingForm'
      );
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (sats: number) => {
    if (currency === 'SATS' || currency === 'BTC') {
      return `${sats.toLocaleString()} sats`;
    }
    return `${sats.toLocaleString()} ${currency}`;
  };

  // Success state
  if (isSuccess && bookingId) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Request Sent!</h3>
        <p className="text-gray-600 mb-6">
          Your booking request has been sent to the service provider. You&apos;ll receive a
          notification when they respond.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-medium text-gray-900 mb-2">{serviceName}</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{formatDate(selectedSlot.start)}</p>
            <p>
              {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
            </p>
            <p className="font-medium text-gray-900">{formatPrice(priceSats)}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push('/dashboard/bookings')}>
            View My Bookings
          </Button>
          <Button onClick={() => router.push('/services')}>Browse More Services</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Booking Summary</h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{formatDate(selectedSlot.start)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-700">
                {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
              </p>
              <p className="text-sm text-gray-500">
                {Math.round(
                  (selectedSlot.end.getTime() - selectedSlot.start.getTime()) / (1000 * 60)
                )}{' '}
                minutes
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{formatPrice(priceSats)}</p>
              <p className="text-sm text-gray-500">Payment due upon confirmation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="h-4 w-4 inline mr-1" />
          Notes for provider (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any special requests or information for the service provider..."
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />
        <p className="text-xs text-gray-500 mt-1">{notes.length}/500 characters</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending Request...
            </>
          ) : (
            'Request Booking'
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        By requesting this booking, you agree to our terms of service. Payment will be collected
        after the provider confirms your booking.
      </p>
    </form>
  );
}

export default BookingForm;
