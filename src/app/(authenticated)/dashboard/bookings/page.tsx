'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { STATUS } from '@/config/database-constants';
import BookingTabs from './components/BookingTabs';
import BookingCard from './components/BookingCard';
import type { Booking } from './components/BookingCard';
import type { TabType, FilterStatus, TabConfig } from './components/BookingTabs';

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
          status = STATUS.BOOKINGS.PENDING;
          break;
        case 'confirmed':
          status = `${STATUS.BOOKINGS.CONFIRMED},${STATUS.BOOKINGS.IN_PROGRESS}`;
          break;
        case 'history':
          status = `${STATUS.BOOKINGS.COMPLETED},${STATUS.BOOKINGS.CANCELLED},${STATUS.BOOKINGS.REJECTED}`;
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

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  const tabs: TabConfig[] = [
    {
      id: 'incoming',
      label: 'Incoming Requests',
      count: bookings.filter(b => b.status === STATUS.BOOKINGS.PENDING).length,
    },
    {
      id: 'confirmed',
      label: 'Confirmed',
      count: bookings.filter(
        b => b.status === STATUS.BOOKINGS.CONFIRMED || b.status === STATUS.BOOKINGS.IN_PROGRESS
      ).length,
    },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
        <p className="text-gray-600 mt-1">Review and manage booking requests for your services</p>
      </div>

      <BookingTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />

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
            <BookingCard
              key={booking.id}
              booking={booking}
              processingId={processingId}
              formatAmount={formatAmount}
              onAction={handleAction}
              onViewDetails={(id) => router.push(`/dashboard/bookings/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
