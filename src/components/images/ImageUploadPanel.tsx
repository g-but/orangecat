'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_MAX_MB,
  uploadUserImage,
} from '@/services/images/upload';
import type { StockImage } from '@/services/images/types';

/**
 * Own-photo upload for the shared image picker. Validates client-side,
 * uploads to the user's storage folder, and hands the picked image back in
 * the same StockImage shape the search/generate tabs use.
 */
export default function ImageUploadPanel({ onPick }: { onPick: (image: StockImage) => void }) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file || busy || !user?.id) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await uploadUserImage(user.id, file, 'post-image');
    setBusy(false);
    if (!result.success || !result.url) {
      setError(result.error || 'Upload failed. Please try again.');
      return;
    }
    onPick({
      id: `upload-${Date.now()}`,
      thumbUrl: result.url,
      fullUrl: result.url,
      title: file.name.replace(/\.[^.]+$/, ''),
      creator: null,
      license: '',
      sourceUrl: null,
    });
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        className="hidden"
        aria-label="Choose an image file"
        onChange={e => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy || !user?.id}
        className="inline-flex items-center gap-1.5 rounded-md bg-accent-warm px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent-warm/90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {busy ? 'Uploading…' : 'Choose a photo'}
      </button>
      {error && <p className="text-xs text-status-negative">{error}</p>}
      <p className="text-2xs text-fg-tertiary">
        JPEG, PNG, WebP, or GIF — up to {IMAGE_UPLOAD_MAX_MB}MB.
      </p>
    </div>
  );
}
