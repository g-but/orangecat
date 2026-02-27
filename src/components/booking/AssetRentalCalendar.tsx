'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

interface AvailabilityDay {
  date: string;
  available: boolean;
}

interface AssetRentalCalendarProps {
  assetId: string;
  onDateRangeSelect: (startDate: Date, endDate: Date) => void;
  selectedStartDate?: Date | null;
  selectedEndDate?: Date | null;
  minPeriod?: number;
  maxPeriod?: number;
  periodType?: 'hourly' | 'daily' | 'weekly' | 'monthly';
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

export function AssetRentalCalendar({
  assetId,
  onDateRangeSelect,
  selectedStartDate,
  selectedEndDate,
  minPeriod = 1,
  maxPeriod,
  periodType = 'daily',
}: AssetRentalCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectingStart, setSelectingStart] = useState(true);
  const [availability, setAvailability] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Load availability for current month view
  useEffect(() => {
    const loadAvailability = async () => {
      setIsLoading(true);
      try {
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);

        const response = await fetch(
          `/api/assets/${assetId}/availability?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`
        );

        if (response.ok) {
          const data = await response.json();
          const availMap = new Map<string, boolean>();
          (data.data?.availability || []).forEach((day: AvailabilityDay) => {
            availMap.set(day.date, day.available);
          });
          setAvailability(availMap);
        }
      } catch (error) {
        logger.error('Error loading availability', error, 'Booking');
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailability();
  }, [currentMonth, assetId]);

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

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    if (date < today) {
      return;
    }

    const dateStr = date.toISOString().split('T')[0];
    if (!availability.get(dateStr)) {
      return;
    }

    setValidationError(null);

    if (selectingStart) {
      // Selecting start date
      onDateRangeSelect(date, date);
      setSelectingStart(false);
    } else {
      // Selecting end date
      if (selectedStartDate && date >= selectedStartDate) {
        // Validate period length
        const diffDays =
          Math.round((date.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const unit = periodType === 'weekly' ? 'week' : periodType === 'monthly' ? 'month' : 'day';
        const effectiveMin = minPeriod ?? 1;

        if (diffDays < effectiveMin) {
          setValidationError(
            `Minimum rental period is ${effectiveMin} ${unit}${effectiveMin !== 1 ? 's' : ''}.`
          );
          return;
        }
        if (maxPeriod !== undefined && diffDays > maxPeriod) {
          setValidationError(
            `Maximum rental period is ${maxPeriod} ${unit}${maxPeriod !== 1 ? 's' : ''}.`
          );
          return;
        }
        onDateRangeSelect(selectedStartDate, date);
      } else {
        // Clicked before start — restart selection
        onDateRangeSelect(date, date);
      }
      setSelectingStart(true);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!selectedStartDate || !selectedEndDate) {
      return false;
    }
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  const isDateAvailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availability.get(dateStr) ?? false;
  };

  const days = getDaysInMonth();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Month Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-semibold text-gray-900">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1 rounded hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Selection Instructions */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
        {selectingStart ? (
          <span>Select rental start date</span>
        ) : (
          <span>Select rental end date</span>
        )}
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

        {/* Loading Overlay */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Calendar Days */}
        {!isLoading && (
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="h-10" />;
              }

              const isPast = date < today;
              const isAvailable = isDateAvailable(date);
              const isInRange = isDateInRange(date);
              const isStartDate =
                selectedStartDate && date.toDateString() === selectedStartDate.toDateString();
              const isEndDate =
                selectedEndDate && date.toDateString() === selectedEndDate.toDateString();
              const isToday = date.toDateString() === today.toDateString();

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  disabled={isPast || !isAvailable}
                  className={cn(
                    'h-10 w-full rounded-md text-sm font-medium transition-colors',
                    isPast && 'text-gray-300 cursor-not-allowed',
                    !isPast && !isAvailable && 'text-gray-300 cursor-not-allowed bg-gray-50',
                    !isPast && isAvailable && !isInRange && 'hover:bg-gray-100 text-gray-700',
                    isInRange && !isStartDate && !isEndDate && 'bg-sky-100 text-sky-700',
                    (isStartDate || isEndDate) && 'bg-sky-500 text-white',
                    isToday && !isInRange && 'border border-sky-500 text-sky-600'
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-sky-500"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-sky-100"></div>
          <span>In range</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-gray-100"></div>
          <span>Unavailable</span>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="px-4 py-2 border-t border-red-100 bg-red-50">
          <p className="text-sm text-red-600">{validationError}</p>
        </div>
      )}

      {/* Selected Range Summary */}
      {selectedStartDate && selectedEndDate && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Selected: </span>
            {selectedStartDate.toLocaleDateString()} - {selectedEndDate.toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default AssetRentalCalendar;
