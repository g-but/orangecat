'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface BookingCalendarProps {
  serviceId: string;
  onSlotSelect: (slot: { start: Date; end: Date }) => void;
  selectedSlot?: { start: Date; end: Date } | null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function BookingCalendar({ serviceId, onSlotSelect, selectedSlot }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate calendar days for current month
  const getDaysInMonth = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  // Load slots when date is selected
  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }

    const loadSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await fetch(`/api/services/${serviceId}/availability?date=${dateStr}`);

        if (response.ok) {
          const data = await response.json();
          setSlots(data.data?.slots || []);
        }
      } catch (error) {
        logger.error('Error loading slots', error, 'Booking');
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedDate, serviceId]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    if (date < today) {
      return;
    }
    setSelectedDate(date);
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.available) {
      return;
    }
    onSlotSelect({
      start: new Date(slot.start),
      end: new Date(slot.end),
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSelectedSlot = (slot: TimeSlot) => {
    if (!selectedSlot) {
      return false;
    }
    return (
      new Date(slot.start).getTime() === selectedSlot.start.getTime() &&
      new Date(slot.end).getTime() === selectedSlot.end.getTime()
    );
  };

  const days = getDaysInMonth();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Month Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded hover:bg-gray-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-semibold text-gray-900">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1 rounded hover:bg-gray-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-10" />;
            }

            const isPast = date < today;
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === today.toDateString();

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                disabled={isPast}
                className={cn(
                  'h-10 w-full rounded-md text-sm font-medium transition-colors',
                  isPast && 'text-gray-300 cursor-not-allowed',
                  !isPast && !isSelected && 'hover:bg-gray-100 text-gray-700',
                  isSelected && 'bg-sky-500 text-white',
                  isToday && !isSelected && 'border border-sky-500 text-sky-600'
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Available times for{' '}
            {selectedDate.toLocaleDateString([], {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h4>

          {isLoadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No available slots for this date
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot, index) => (
                <Button
                  key={index}
                  variant={isSelectedSlot(slot) ? 'primary' : 'outline'}
                  size="sm"
                  disabled={!slot.available}
                  onClick={() => handleSlotClick(slot)}
                  className={cn(
                    'text-sm',
                    !slot.available && 'opacity-50 cursor-not-allowed',
                    isSelectedSlot(slot) && 'ring-2 ring-sky-500 ring-offset-2'
                  )}
                >
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BookingCalendar;
