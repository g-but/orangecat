'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Filter,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface Booking {
  id: string;
  bookable_type: string;
  bookable_id: string;
  provider_actor_id: string;
  customer_actor_id: string;
  customer_user_id: string;
  starts_at: string;
  ends_at: string;
  price_sats: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  customer_notes?: string;
  provider_notes?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

type TabType = 'incoming' | 'confirmed' | 'history';
type FilterStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function BookingsDashboardPage() {
  const router = useRouter();
  const { formatAmount } = useDisplayCurrency();
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      let status = '';
      switch (activeTab) {
        case 'incoming':
          status = 'pending';
          break;
        case 'confirmed':
          status = 'confirmed,in_progress';
          break;
        case 'history':
          status = 'completed,cancelled,rejected';
          break;
      }

      const response = await fetch(`/api/bookings?role=provider&status=${status}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (error) {
      logger.error('Error loading bookings', error, 'Booking');
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleAction = async (
    bookingId: string,
    action: 'confirm' | 'reject' | 'complete' | 'cancel',
    reason?: string
  ) => {
    setProcessingId(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          action === 'confirm'
            ? 'Booking confirmed!'
            : action === 'reject'
              ? 'Booking rejected'
              : action === 'complete'
                ? 'Booking marked as complete'
                : 'Booking cancelled'
        );
        loadBookings();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch (error) {
      logger.error('Action error', error, 'Booking');
      toast.error('Something went wrong');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (sats: number) => {
    return formatAmount(sats);
  };

  const getStatusBadge = (status: string) => {
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
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') {
      return true;
    }
    return booking.status === filterStatus;
  });

  const tabs: { id: TabType; label: string; count?: number }[] = [
    {
      id: 'incoming',
      label: 'Incoming Requests',
      count: bookings.filter(b => b.status === 'pending').length,
    },
    {
      id: 'confirmed',
      label: 'Confirmed',
      count: bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length,
    },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
        <p className="text-gray-600 mt-1">Review and manage booking requests for your services</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    'ml-2 py-0.5 px-2 rounded-full text-xs',
                    activeTab === tab.id ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filter (for history tab) */}
      {activeTab === 'history' && (
        <div className="mb-6 flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as FilterStatus)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      {/* Bookings List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
          <p className="text-gray-500">
            {activeTab === 'incoming'
              ? "You don't have any pending booking requests"
              : activeTab === 'confirmed'
                ? "You don't have any confirmed bookings"
                : 'No booking history yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-6">
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
                    {getStatusBadge(booking.status)}
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
                      {formatPrice(booking.price_sats)}
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
                  {booking.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAction(booking.id, 'confirm')}
                        disabled={processingId === booking.id}
                      >
                        {processingId === booking.id ? (
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
                        onClick={() => {
                          const reason = window.prompt('Reason for rejection (optional):');
                          handleAction(booking.id, 'reject', reason || undefined);
                        }}
                        disabled={processingId === booking.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}

                  {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAction(booking.id, 'complete')}
                        disabled={processingId === booking.id}
                      >
                        {processingId === booking.id ? (
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
                        onClick={() => {
                          const reason = window.prompt('Reason for cancellation (optional):');
                          handleAction(booking.id, 'cancel', reason || undefined);
                        }}
                        disabled={processingId === booking.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}

                  {(booking.status === 'completed' ||
                    booking.status === 'cancelled' ||
                    booking.status === 'rejected') && (
                    <span className="text-sm text-gray-500">
                      {booking.status === 'completed' && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Completed
                        </span>
                      )}
                      {booking.status === 'cancelled' && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <AlertCircle className="h-4 w-4" />
                          Cancelled
                        </span>
                      )}
                      {booking.status === 'rejected' && (
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
                  onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                  className="text-sky-600 hover:text-sky-700"
                >
                  View details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
