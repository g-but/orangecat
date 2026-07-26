'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { COVER_ACCEPT, COVER_MAX_MB, uploadArticleCover } from '@/services/articles/cover-storage';

/**
 * Article cover picker: drag-and-drop or click to upload (primary), with a
 * "paste a URL" fallback. Uploads via the cover-storage service and returns a
 * public URL through onChange. Design-token styling only.
 */
export default function CoverImageUpload({
  value,
  onChange,
  userId,
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  userId: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlMode, setUrlMode] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || disabled) {
      return;
    }
    setUploading(true);
    setError(null);
    const result = await uploadArticleCover(userId, file);
    if (result.success && result.url) {
      onChange(result.url);
    } else {
      setError(result.error || 'Upload failed. Please try again.');
    }
    setUploading(false);
  }

  // Cover already chosen — show a preview with replace/remove.
  if (value && !urlMode) {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-subtle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Cover preview" className="aspect-[2/1] w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-black hover:bg-white disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Replace'}
          </button>
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-black hover:bg-white disabled:opacity-50"
          >
            <X className="h-4 w-4" /> Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={COVER_ACCEPT}
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
        {error && <p className="px-3 py-2 text-xs text-status-negative">{error}</p>}
      </div>
    );
  }

  if (urlMode) {
    return (
      <div className="space-y-2">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Cover image URL"
          type="url"
          aria-label="Cover image URL"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setUrlMode(false)}
          className="inline-flex items-center gap-1 text-xs text-fg-secondary hover:text-fg-primary"
        >
          <ImagePlus className="h-3.5 w-3.5" /> Upload an image instead
        </button>
      </div>
    );
  }

  // Empty state — dropzone.
  return (
    <div>
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors',
          dragging
            ? 'border-accent-warm bg-accent-warm/5'
            : 'border-default hover:bg-surface-raised/40',
          (disabled || uploading) && 'cursor-not-allowed opacity-60'
        )}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-fg-tertiary" />
        ) : (
          <ImagePlus className="h-6 w-6 text-fg-tertiary" />
        )}
        <span className="text-sm font-medium text-fg-primary">
          {uploading ? 'Uploading…' : 'Add a cover image'}
        </span>
        <span className="text-xs text-fg-tertiary">
          Drag & drop or click · JPEG, PNG, WebP up to {COVER_MAX_MB}MB
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={COVER_ACCEPT}
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setUrlMode(true)}
          className="inline-flex items-center gap-1 text-xs text-fg-secondary hover:text-fg-primary"
        >
          <Link2 className="h-3.5 w-3.5" /> Paste a URL instead
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-status-negative">{error}</p>}
    </div>
  );
}
