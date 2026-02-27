'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onUpload?: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  label?: string;
  preview?: boolean;
  disabled?: boolean;
}

export default function ImageUpload({
  onUpload,
  accept = 'image/*',
  maxSizeMB = 5,
  className,
  label = 'Upload Image',
  preview = true,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validate = (file: File): string | null => {
    if (!file.type.startsWith('image/') && accept === 'image/*') {
      return 'Only image files are allowed.';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be under ${maxSizeMB}MB.`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    if (preview) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
    onUpload?.(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) {
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearPreview = () => {
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {previewUrl ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Upload preview"
            className="max-h-48 max-w-full rounded-lg object-contain border border-gray-200"
          />
          <button
            type="button"
            onClick={clearPreview}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-gray-800 text-white hover:bg-gray-700"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && !disabled && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed',
            'p-6 text-center cursor-pointer transition-colors',
            isDragging ? 'border-tiffany bg-tiffany/5' : 'border-gray-300 hover:border-gray-400',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
            {isDragging ? (
              <ImageIcon className="h-5 w-5 text-tiffany" />
            ) : (
              <Upload className="h-5 w-5 text-gray-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-500 mt-1">Drag & drop or click · Max {maxSizeMB}MB</p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        aria-hidden="true"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
