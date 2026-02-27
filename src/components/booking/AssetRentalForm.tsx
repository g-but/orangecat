'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CreditCard, Shield, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { logger } from '@/utils/logger';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface AssetRentalFormProps {
  assetId: string;
  assetName: string;
  rentalPriceSats: number;
  periodType: 'hourly' | 'daily' | 'weekly' | 'monthly';
  requiresDeposit?: boolean;
  depositAmountSats?: number;
  currency?: string;
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  onBack?: () => void;
}

export function AssetRentalForm({
  assetId,
  assetName,
  rentalPriceSats,
  periodType,
  requiresDeposit = false,
  depositAmountSats = 0,
  currency: _currency = 'SATS',
  selectedStartDate,
  selectedEndDate,
  onBack,
}: AssetRentalFormProps) {
  const router = useRouter();
  const { formatAmount } = useDisplayCurrency();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  if (!selectedStartDate || !selectedEndDate) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Please select rental dates first</p>
      </div>
    );
  }

  // Calculate rental periods
  const calculatePeriods = () => {
    const durationMs = selectedEndDate.getTime() - selectedStartDate.getTime();
    switch (periodType) {
      case 'hourly':
        return Math.ceil(durationMs / (1000 * 60 * 60));
      case 'daily':
        return Math.ceil(durationMs / (1000 * 60 * 60 * 24)) || 1;
      case 'weekly':
        return Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7)) || 1;
      case 'monthly':
        return Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 30)) || 1;
      default:
        return Math.ceil(durationMs / (1000 * 60 * 60 * 24)) || 1;
    }
  };

  const periods = calculatePeriods();
  const totalPrice = rentalPriceSats * periods;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/assets/${assetId}/rent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starts_at: selectedStartDate.toISOString(),
          ends_at: selectedEndDate.toISOString(),
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setBookingId(data.data.id);
        toast.success('Rental request sent!');
      } else {
        toast.error(data.error || 'Failed to create rental request');
      }
    } catch (error) {
      logger.error('Rental request error', error, 'Booking');
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

  const formatPrice = (sats: number) => {
    return formatAmount(sats);
  };

  const getPeriodLabel = () => {
    switch (periodType) {
      case 'hourly':
        return periods === 1 ? 'hour' : 'hours';
      case 'daily':
        return periods === 1 ? 'day' : 'days';
      case 'weekly':
        return periods === 1 ? 'week' : 'weeks';
      case 'monthly':
        return periods === 1 ? 'month' : 'months';
      default:
        return 'periods';
    }
  };

  // Success state
  if (isSuccess && bookingId) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Rental Request Sent!</h3>
        <p className="text-gray-600 mb-6">
          Your rental request has been sent to the asset owner. You&apos;ll receive a notification
          when they respond.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-medium text-gray-900 mb-2">{assetName}</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              {formatDate(selectedStartDate)} - {formatDate(selectedEndDate)}
            </p>
            <p>
              {periods} {getPeriodLabel()}
            </p>
            <p className="font-medium text-gray-900">{formatPrice(totalPrice)}</p>
            {requiresDeposit && depositAmountSats > 0 && (
              <p className="text-orange-600">+ {formatPrice(depositAmountSats)} deposit</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push(ROUTES.DASHBOARD.BOOKINGS)}>
            View My Rentals
          </Button>
          <Button onClick={() => router.push('/assets')}>Browse More Assets</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rental Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Rental Summary</h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{formatDate(selectedStartDate)}</p>
              <p className="text-sm text-gray-600">to</p>
              <p className="font-medium text-gray-900">{formatDate(selectedEndDate)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {periods} {getPeriodLabel()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">
                {formatPrice(rentalPriceSats)} per {periodType.replace('ly', '')} × {periods}
              </p>
              <p className="font-medium text-gray-900">{formatPrice(totalPrice)}</p>
            </div>
          </div>

          {requiresDeposit && depositAmountSats > 0 && (
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <p className="font-medium text-orange-600">
                  Security deposit: {formatPrice(depositAmountSats)}
                </p>
                <p className="text-sm text-gray-600">Refundable upon return</p>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(totalPrice + (requiresDeposit ? depositAmountSats : 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-2">
          <MessageSquare className="h-4 w-4 inline mr-1" />
          Notes for owner (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any special requests or information for the asset owner..."
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
            'Request Rental'
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        By requesting this rental, you agree to our terms of service. Payment will be collected
        after the owner confirms your request.
      </p>
    </form>
  );
}

export default AssetRentalForm;
