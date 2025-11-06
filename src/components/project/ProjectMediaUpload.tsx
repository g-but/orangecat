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

  /**
   * Compress and resize image client-side before upload
   * Reduces file size significantly while maintaining quality
   */
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = event => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not create canvas context'));
            return;
          }

          // Max dimensions for project images (optimized for web display)
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1200;
          const QUALITY = 0.85; // 85% quality for good balance

          // Calculate new dimensions maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(new Error('Image compression failed'));
                return;
              }

              // Convert to File with original name
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg', // Always use JPEG for better compression
                lastModified: Date.now(),
              });

              // Only use compressed if it's actually smaller
              if (compressedFile.size < file.size) {
                resolve(compressedFile);
              } else {
                // If compression didn't help, use original
                resolve(file);
              }
            },
            'image/jpeg',
            QUALITY
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Double-check we can still upload (in case state changed)
    if (media.length >= maxImages) {
      toast.error(
        `Maximum ${maxImages} images allowed. Please refresh the page if you just deleted an image.`
      );
      await loadMedia(); // Refresh to get latest state
      return;
    }

    setUploading(true);

    try {
      // Compress image before upload to reduce storage size
      const compressedFile = await compressImage(file);
      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);

      if (compressedFile.size < file.size) {
        console.log(
          `Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`
        );
      }

      // Step 1: Get presigned upload URL (use .jpg extension for compressed images)
      const fileName = file.name.replace(/\.[^/.]+$/, '.jpg');
      const urlResponse = await fetch(`/api/projects/${projectId}/media/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });

      if (!urlResponse.ok) {
        const error = await urlResponse.json();
        throw new Error(error.error || 'Failed to get upload URL');
      }

      const { upload_url, path } = await urlResponse.json();

      // Step 2: Upload compressed file directly to storage
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: compressedFile,
        headers: {
          'Content-Type': 'image/jpeg', // Always JPEG after compression
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
      // Reload media immediately to update state
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
              <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 shadow-sm group-hover:border-orange-300 transition-all duration-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.alt_text || 'Project image'}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => deleteMedia(item.id)}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                disabled={uploading}
                aria-label="Delete image"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-md font-medium">
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
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
              ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/30'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
            `}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
                <p className="text-sm font-medium text-gray-700">Uploading...</p>
                <p className="text-xs text-gray-500">Please wait</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Upload className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Drop image here or click to select
                  </p>
                  <p className="text-xs text-gray-500">
                    {ALLOWED_TYPES.map(t => t.split('/')[1].toUpperCase()).join(', ')} • Max{' '}
                    {maxFileSizeMB}MB • {media.length}/{maxImages} uploaded
                  </p>
                </div>
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
