/**
 * ProjectMediaUpload Component
 *
 * Handles image uploads for projects using presigned upload flow.
 * - Drag-and-drop or click to select
 * - Maximum 3 images per project
 * - Shows preview thumbnails
 * - Client-side validation (type, size)
 * - Direct upload to Supabase Storage (no proxy)
 *
 * @module components/project
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import supabaseBrowser from '@/lib/supabase/browser';

interface MediaItem {
  id: string;
  storage_path: string;
  position: number;
  alt_text?: string | null;
  url?: string;
}

interface ProjectMediaUploadProps {
  projectId: string;
  onUploadComplete?: () => void;
  maxImages?: number;
  maxFileSizeMB?: number;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_MAX_IMAGES = 3;

export default function ProjectMediaUpload({
  projectId,
  onUploadComplete,
  maxImages = DEFAULT_MAX_IMAGES,
  maxFileSizeMB = DEFAULT_MAX_SIZE_MB,
}: ProjectMediaUploadProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing media
  useEffect(() => {
    loadMedia();
  }, [projectId]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseBrowser
        .from('project_media')
        .select('id, storage_path, position, alt_text')
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) {
        throw error;
      }

      // Derive public URLs
      const mediaWithUrls = (data || []).map(m => {
        const { data: urlData } = supabaseBrowser.storage
          .from('project-media')
          .getPublicUrl(m.storage_path);
        return { ...m, url: urlData.publicUrl };
      });

      setMedia(mediaWithUrls);
    } catch (err) {
      console.error('Failed to load media:', err);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: ${ALLOWED_TYPES.map(t => t.split('/')[1]).join(', ')}`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxFileSizeMB) {
      return `File too large. Maximum size: ${maxFileSizeMB}MB`;
    }

    // Check count
    if (media.length >= maxImages) {
      return `Maximum ${maxImages} images allowed`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);

    try {
      // Step 1: Get presigned upload URL
      const urlResponse = await fetch(`/api/projects/${projectId}/media/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name }),
      });

      if (!urlResponse.ok) {
        const error = await urlResponse.json();
        throw new Error(error.error || 'Failed to get upload URL');
      }

      const { upload_url, path } = await urlResponse.json();

      // Step 2: Upload file directly to storage
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Step 3: Save metadata
      const metadataResponse = await fetch(`/api/projects/${projectId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          alt_text: file.name.split('.')[0], // Use filename as alt text
        }),
      });

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json();
        throw new Error(error.error || 'Failed to save metadata');
      }

      toast.success('Image uploaded successfully!');
      await loadMedia();
      onUploadComplete?.();
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    if (!confirm('Delete this image?')) {
      return;
    }

    try {
      const { error } = await supabaseBrowser.from('project_media').delete().eq('id', mediaId);

      if (error) {
        throw error;
      }

      toast.success('Image deleted');
      await loadMedia();
      onUploadComplete?.();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete image');
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]); // Upload first file
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading images...
      </div>
    );
  }

  const canUploadMore = media.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Existing Images */}
      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {media.map(item => (
            <div key={item.id} className="relative group">
              <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.alt_text || 'Project image'}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => deleteMedia(item.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                Position {item.position + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      {canUploadMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  Drop image here or click to select
                </p>
                <p className="text-xs text-gray-500">
                  {ALLOWED_TYPES.map(t => t.split('/')[1].toUpperCase()).join(', ')} • Max{' '}
                  {maxFileSizeMB}MB • {media.length}/{maxImages} uploaded
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Message */}
      {!canUploadMore && (
        <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Maximum images reached</p>
            <p>Delete an image to upload a new one.</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {media.length === 0 && !uploading && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No images yet. Upload your first image to get started.</p>
        </div>
      )}
    </div>
  );
}
