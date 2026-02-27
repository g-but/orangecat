'use client';

import { useRef, useEffect, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  label?: string;
  maxLength?: number;
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  className,
  minRows = 4,
  maxRows = 20,
  disabled = false,
  required = false,
  id,
  label,
  maxLength,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea based on content
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }

    const lineHeight = parseInt(getComputedStyle(el).lineHeight || '24', 10);
    const minHeight = minRows * lineHeight;
    const maxHeight = maxRows * lineHeight;

    el.style.height = 'auto';
    const scrollHeight = el.scrollHeight;
    el.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  useEffect(() => {
    autoResize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    autoResize();
    onChange?.(e.target.value);
  };

  const lineHeight = 24;
  const minHeight = minRows * lineHeight;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        rows={minRows}
        style={{ minHeight: `${minHeight}px` }}
        className={cn(
          'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm resize-none',
          'focus:border-tiffany focus:outline-none focus:ring-1 focus:ring-tiffany',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
          'transition-[height]',
          className
        )}
      />
      {maxLength !== undefined && (
        <p className="text-xs text-gray-400 text-right">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}
