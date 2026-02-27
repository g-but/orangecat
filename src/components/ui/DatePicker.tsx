'use client';

import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  id?: string;
  placeholder?: string;
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  className,
  disabled = false,
  required = false,
  label,
  id,
}: DatePickerProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="date"
        id={id}
        value={value ?? ''}
        min={min}
        max={max}
        disabled={disabled}
        required={required}
        onChange={e => onChange?.(e.target.value)}
        className={cn(
          'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm',
          'focus:border-tiffany focus:outline-none focus:ring-1 focus:ring-tiffany',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
          className
        )}
      />
    </div>
  );
}
