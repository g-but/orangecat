'use client';

import { useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { STATUS } from '@/config/database-constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Booking {
  id: string;
  bookable_type: string;
  bookable_id: string;
  provider_actor_id: string;
  customer_actor_id: string;
  customer_user_id: string;
  starts_at: string;
  ends_at: string;
  price_btc: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  customer_notes?: string;
  provider_notes?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface BookingCardProps {
  booking: Booking;
  processingId: string | null;
  formatAmount: (amount: number) => string;
  onAction: (bookingId: string, action: 'confirm' | 'reject' | 'complete' | 'cancel', reason?: string) => void;
  onViewDetails: (bookingId: string) => void;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-medium rounded-full',
        styles[status] || 'bg-gray-100 text-gray-800'
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

export default function BookingCard({
  booking,
  processingId,
  formatAmount,
  onAction,
  onViewDetails,
}: BookingCardProps) {
  const isProcessing = processingId === booking.id;
  const [reasonDialog, setReasonDialog] = useState<{ action: 'reject' | 'cancel'; reason: string } | null>(null);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {booking.customer?.display_name || booking.customer?.username || 'Customer'}
              </p>
              <p className="text-sm text-gray-500">
                {(booking.metadata?.service_title as string) || 'Service booking'}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{formatDate(booking.starts_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {formatTime(booking.starts_at)} - {formatTime(booking.ends_at)}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatAmount(booking.price_btc)}
            </div>
          </div>

          {/* Customer Notes */}
          {booking.customer_notes && (
            <div className="bg-gray-50 rounded-md p-3 mb-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Customer notes:</p>
              <p className="text-sm text-gray-700">{booking.customer_notes}</p>
            </div>
          )}

          {/* Rejection/Cancellation Reason */}
          {(booking.rejection_reason || booking.cancellation_reason) && (
            <div className="bg-red-50 rounded-md p-3 mb-4">
              <p className="text-xs font-medium text-red-500 mb-1">
                {booking.rejection_reason ? 'Rejection' : 'Cancellation'} reason:
              </p>
              <p className="text-sm text-red-700">
                {booking.rejection_reason || booking.cancellation_reason}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-4 flex flex-col gap-2">
          {booking.status === STATUS.BOOKINGS.PENDING && (
            <>
              <Button
                size="sm"
                onClick={() => onAction(booking.id, 'confirm')}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirm
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReasonDialog({ action: 'reject', reason: '' })}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}

          {(booking.status === STATUS.BOOKINGS.CONFIRMED ||
            booking.status === STATUS.BOOKINGS.IN_PROGRESS) && (
            <>
              <Button
                size="sm"
                onClick={() => onAction(booking.id, 'complete')}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReasonDialog({ action: 'cancel', reason: '' })}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </>
          )}

          {(booking.status === STATUS.BOOKINGS.COMPLETED ||
            booking.status === STATUS.BOOKINGS.CANCELLED ||
            booking.status === STATUS.BOOKINGS.REJECTED) && (
            <span className="text-sm text-gray-500">
              {booking.status === STATUS.BOOKINGS.COMPLETED && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </span>
              )}
              {booking.status === STATUS.BOOKINGS.CANCELLED && (
                <span className="flex items-center gap-1 text-gray-500">
                  <AlertCircle className="h-4 w-4" />
                  Cancelled
                </span>
              )}
              {booking.status === STATUS.BOOKINGS.REJECTED && (
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle className="h-4 w-4" />
                  Rejected
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>
          Requested{' '}
          {new Date(booking.created_at).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <button
          onClick={() => onViewDetails(booking.id)}
          className="text-tiffany-600 hover:text-tiffany-700"
        >
          View details &rarr;
        </button>
      </div>
      <Dialog open={!!reasonDialog} onOpenChange={open => !open && setReasonDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {reasonDialog?.action === 'reject' ? 'Reject booking' : 'Cancel booking'}
            </DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
            rows={3}
            placeholder="Reason (optional)"
            value={reasonDialog?.reason ?? ''}
            onChange={e =>
              setReasonDialog(prev => prev ? { ...prev, reason: e.target.value } : null)
            }
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReasonDialog(null)}>
              Back
            </Button>
            <Button
              onClick={() => {
                if (reasonDialog) {
                  onAction(booking.id, reasonDialog.action, reasonDialog.reason || undefined);
                  setReasonDialog(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {reasonDialog?.action === 'reject' ? 'Reject' : 'Cancel booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export type { Booking };
